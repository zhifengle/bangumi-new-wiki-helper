import { SiteConfig } from '../interface/wiki';
import { findElement } from '../utils/domUtils';
import {
  getQueryInfo,
  insertControlBtn,
  getWikiData,
  getWikiDataByURL,
  combineInfoList,
} from '../sites/common';
import { SubjectWikiInfo } from '../interface/subject';
import { checkSubjectExit } from '../sites/bangumi';
import {
  AUTO_FILL_FORM,
  BGM_DOMAIN,
  PROTOCOL,
  WIKI_DATA,
  SUBJECT_ID,
} from './constraints';
import { sleep } from '../utils/async/sleep';
import { getHooks } from '../sites';
import { IAuxPrefs } from '../sites/types';
import { getSubjectId } from '../sites/bangumi/common';

async function updateAuxData(auxSite: string, auxPrefs: IAuxPrefs = {}) {
  try {
    console.info('the start of updating aux data');
    const auxData = await getWikiDataByURL(auxSite);
    console.info('auxiliary data: ', auxData);
    const wikiData = JSON.parse(GM_getValue(WIKI_DATA) || null);
    let infos = combineInfoList(wikiData.infos, auxData, auxPrefs);
    if (auxSite.match(/store\.steampowered\.com/)) {
      infos = combineInfoList(auxData, wikiData.infos);
    }
    GM_setValue(
      WIKI_DATA,
      JSON.stringify({
        type: wikiData.type,
        subtype: wikiData.subType || 0,
        infos,
      })
    );
    console.info('the end of updating aux data');
  } catch (e) {
    console.error(e);
  }
}

export async function initCommon(siteConfig: SiteConfig) {
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const $title = findElement(siteConfig.controlSelector);
  if (!$title) return;
  let bcRes = await getHooks(siteConfig, 'beforeCreate')();
  if (!bcRes) return;
  if (bcRes === true) {
    bcRes = {};
  }
  const { payload = {} } = bcRes;
  console.info(siteConfig.description, ' content script init');
  insertControlBtn($title, async (e, flag) => {
    const protocol = GM_getValue(PROTOCOL) || 'https';
    const bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
    const bgmHost = `${protocol}://${bgm_domain}`;
    console.info('init');
    const infoList = await getWikiData(siteConfig);
    console.info('wiki info list: ', infoList);
    const wikiData: SubjectWikiInfo = {
      type: siteConfig.type,
      subtype: siteConfig.subType,
      infos: infoList,
    };
    GM_setValue(WIKI_DATA, JSON.stringify(wikiData));
    if (flag) {
      let result = await checkSubjectExit(
        getQueryInfo(infoList),
        bgmHost,
        wikiData.type,
        payload?.disableDate
      );
      console.info('search results: ', result);
      if (result && result.url) {
        GM_setValue(SUBJECT_ID, getSubjectId(result.url));
        await sleep(100);
        GM_openInTab(bgmHost + result.url);
      } else {
        payload.auxSite &&
          (await updateAuxData(payload.auxSite, payload.auxPrefs || {}));
        // 重置自动填表
        GM_setValue(AUTO_FILL_FORM, 1);
        setTimeout(() => {
          GM_openInTab(`${bgmHost}/new_subject/${wikiData.type}`);
        }, 200);
      }
    } else {
      // 重置自动填表
      GM_setValue(AUTO_FILL_FORM, 1);
      payload.auxSite &&
        (await updateAuxData(payload.auxSite, payload.auxPrefs || {}));
      setTimeout(() => {
        GM_openInTab(`${bgmHost}/new_subject/${wikiData.type}`);
      }, 200);
    }
  });
}

export function addStyle() {
  GM_addStyle(`
.e-wiki-new-character, .e-wiki-new-subject, .e-wiki-search-subject, .e-wiki-fill-form {
  color: rgb(0, 180, 30) !important;
  margin-left: 4px !important;
}

.e-wiki-new-subject {
  margin-left: 8px;
}

.e-wiki-new-character:hover,
.e-wiki-new-subject:hover,
.e-wiki-search-subject:hover,
.e-wiki-fill-form:hover {
  color: red !important;
  cursor: pointer;
}

/* upload img */
.e-wiki-cover-container {
  margin-top: 1rem;
}

.e-wiki-cover-container img {
  display: none;
}

#e-wiki-cover-amount {
  padding-left: 10px;
  border: 0;
  color: #f6931f;
  font-size: 20px;
  font-weight: bold;
}

#e-wiki-cover-reset {
  display: inline-block;
  text-align: center;
  width: 60px;
  height: 30px;
  line-height: 30px;
  font-size: 18px;
  background-color: #f09199;
  text-decoration: none;
  color: #fff;
  margin-left: 50px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 1px 1px 2px #333;
}

#e-wiki-cover-preview {
  margin-top: 0.5rem;
}

#e-wiki-cover-preview:active {
  cursor: crosshair;
}

#e-wiki-cover-preview {
  display: block;
}

.e-wiki-cover-blur-loading {
  width: 208px;
  height: 13px;
  background-image: url("https://bgm.tv/img/loadingAnimation.gif");
}

.e-wiki-search-cover {
  width: 84px;
  height: auto;
}

.preview-fetch-img-link {
  margin-left: 8px;
  font-weight: 500;
  color: #149bff !important;
  text-decoration: none;
}
  `);
}
