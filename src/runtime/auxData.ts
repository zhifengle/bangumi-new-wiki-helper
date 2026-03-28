import { AuxSitePayload } from '../interface/types';
import { combineInfoList } from '../sites/core/merge';
import { getWikiDataByURL } from '../sites/core/remote';
import { genAnonymousLinkText } from '../utils/domUtils';
import { RuntimeCapabilities, RuntimeNotifyPayload } from './capabilities';

export type AuxDataRuntime = Pick<RuntimeCapabilities, 'storage' | 'notifier'> & {
  notifier: { notify(message: RuntimeNotifyPayload): void | Promise<void> };
};

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
    await runtime.notifier.notify({
      type: 'info',
      message: `抓取第三方网站信息中:<br/>${buildAuxSiteLink(auxSite)}`,
      duration: 0,
    });
    console.info('the start of updating aux data');
    const auxData = await getWikiDataByURL(auxSite, auxSiteOpts);
    console.info('auxiliary data: ', auxData);
    if (!auxData || (auxData && auxData.length === 0)) {
      await runtime.notifier.notify({
        type: 'error',
        message: `抓取信息为空<br/>
      ${buildAuxSiteLink(auxSite)}
      <br/>
      ${buildUnavailableMessage()}`,
        cmd: 'dismissNotError',
      });
    } else {
      await runtime.notifier.notify({
        type: 'info',
        message: `抓取第三方网站信息成功:<br/>${buildAuxSiteLink(auxSite)}`,
        cmd: 'dismissNotError',
      });
    }
    const wikiData = await runtime.storage.loadSubjectDraft();
    if (!wikiData) {
      throw new Error('wikiData is empty');
    }
    let infos = combineInfoList(wikiData.infos, auxData, auxPrefs);
    if (auxSite.match(/store\.steampowered\.com/)) {
      infos = combineInfoList(auxData, wikiData.infos);
    }
    await runtime.storage.saveSubjectDraft({
      type: wikiData.type,
      subtype: wikiData.subtype || 0,
      infos,
    });
    console.info('the end of updating aux data');
  } catch (error) {
    console.error(error);
    await runtime.notifier.notify({
      type: 'error',
      message: `抓取信息失败<br/>
      ${buildAuxSiteLink(auxSite)}
      <br/>
      ${buildUnavailableMessage()}`,
      cmd: 'dismissNotError',
    });
  }
}
