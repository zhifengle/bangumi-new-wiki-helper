import { AuxSitePayload, LogMsg } from '../interface/types';
import { combineInfoList, getWikiDataByURL } from '../sites/common';
import { genAnonymousLinkText } from '../utils/domUtils';
import { DraftStore } from './draftStore';

type LogPayload = LogMsg & Record<string, string | number>;

export interface AuxDataRuntime {
  draftStore: Pick<DraftStore, 'loadSubjectDraft' | 'saveSubjectDraft'>;
  notify(message: LogPayload): void | Promise<void>;
}

function buildAuxSiteLink(url: string) {
  return genAnonymousLinkText(url, url);
}

function buildUnavailableMessage() {
  return `打开上面链接确认是否能访问以及有信息，再尝试`;
}

export async function updateSubjectDraftFromAuxSite(
  payload: AuxSitePayload,
  runtime: AuxDataRuntime
) {
  const {
    url: auxSite,
    opts: auxSiteOpts = {},
    prefs: auxPrefs = {},
  } = payload;
  try {
    await runtime.notify({
      type: 'info',
      message: `抓取第三方网站信息中:<br/>${buildAuxSiteLink(auxSite)}`,
      duration: 0,
    });
    console.info('the start of updating aux data');
    window._fetch_url_bg = auxSite;
    const auxData = await getWikiDataByURL(auxSite, auxSiteOpts);
    console.info('auxiliary data: ', auxData);
    if (!auxData || (auxData && auxData.length === 0)) {
      await runtime.notify({
        type: 'error',
        message: `抓取信息为空<br/>
      ${buildAuxSiteLink(auxSite)}
      <br/>
      ${buildUnavailableMessage()}`,
        cmd: 'dismissNotError',
      });
    } else {
      await runtime.notify({
        type: 'info',
        message: `抓取第三方网站信息成功:<br/>${buildAuxSiteLink(auxSite)}`,
        cmd: 'dismissNotError',
      });
    }
    const wikiData = await runtime.draftStore.loadSubjectDraft();
    if (!wikiData) {
      throw new Error('wikiData is empty');
    }
    let infos = combineInfoList(wikiData.infos, auxData, auxPrefs);
    if (auxSite.match(/store\.steampowered\.com/)) {
      infos = combineInfoList(auxData, wikiData.infos);
    }
    await runtime.draftStore.saveSubjectDraft({
      type: wikiData.type,
      subtype: wikiData.subtype || 0,
      infos,
    });
    console.info('the end of updating aux data');
  } catch (error) {
    console.error(error);
    await runtime.notify({
      type: 'error',
      message: `抓取信息失败<br/>
      ${buildAuxSiteLink(auxSite)}
      <br/>
      ${buildUnavailableMessage()}`,
      cmd: 'dismissNotError',
    });
  } finally {
    window._fetch_url_bg = null;
  }
}
