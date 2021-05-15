import { SingleInfo, SubjectWikiInfo } from '../interface/subject';
import { InfoConfig, SiteConfig } from '../interface/wiki';
import { getCharaModel } from '../models';
import { addCharaUI, getCharaData } from '../sites/common';
import { sleep } from '../utils/async/sleep';
import { findAllElement, findElement } from '../utils/domUtils';
import { fetchText } from '../utils/fetchData';
import {
  AUTO_FILL_FORM,
  BGM_DOMAIN,
  CHARA_DATA,
  PROTOCOL,
} from './constraints';

export async function initChara(siteConfig: SiteConfig) {
  // 查找标志性的元素
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const charaModel = getCharaModel(siteConfig.key);
  if (!charaModel) return;
  const $el = findElement(charaModel.controlSelector);
  if (!$el) return;
  // 判断是否在 iframe 里面
  let iframeSel = '';
  let $doc: any;
  if (charaModel.itemSelector instanceof Array) {
    iframeSel = charaModel.itemSelector.find(
      (i) => i.isIframe === true
    )?.selector;
  } else if (charaModel.itemSelector.isIframe) {
    iframeSel = charaModel.itemSelector.selector;
  }
  if (iframeSel) {
    console.log('fetch html by background');
    const url = findElement({
      selector: iframeSel,
    }).getAttribute('src');
    if (url) {
      const rawHtml = await fetchText(url);
      $doc = new DOMParser().parseFromString(rawHtml, 'text/html');
    } else {
      return;
    }
  }
  const protocol = GM_getValue(PROTOCOL) || 'https';
  const bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
  const bgmHost = `${protocol}://${bgm_domain}`;
  const itemArr = findAllElement(charaModel.itemSelector);
  // 获取名字列表
  const names = await Promise.all(
    itemArr.map(async ($t) => {
      const nameConfig: InfoConfig = charaModel.itemList.find(
        (item) => item.category == 'crt_name'
      );
      const nameInfo: SingleInfo[] = await getCharaData(
        {
          ...charaModel,
          itemList: [nameConfig],
        },
        $t
      );
      return nameInfo[0]?.value;
    })
  );
  addCharaUI($el, names, async (e: Event, val: string) => {
    let targetList: Element[] = [];
    if (val === 'all') {
      // @TODO 一次性新建全部
      // targetList = [...itemArr];
    } else {
      const idx = names.indexOf(val);
      if (idx !== -1) {
        targetList = itemArr.slice(idx, idx + 1);
      }
    }
    for (const $target of targetList) {
      const charaInfo: SingleInfo[] = await getCharaData(charaModel, $target);
      console.info('character info list: ', charaInfo);
      const charaData: SubjectWikiInfo = {
        type: siteConfig.type,
        infos: charaInfo,
      };
      // 重置自动填表
      GM_setValue(AUTO_FILL_FORM, 1);
      GM_setValue(CHARA_DATA, JSON.stringify(charaData));
      // @TODO 不使用定时器
      await sleep(200);
      GM_openInTab(`${bgmHost}/character/new`);
    }
  });
}
