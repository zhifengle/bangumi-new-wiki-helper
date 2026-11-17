import { AuxSitePayload } from '../interface/types';
import { combineInfoList } from '../sites/core/merge';
import { getWikiDataByURL } from '../sites/core/remote';
import { RuntimeCapabilities, RuntimeNotifier } from './capabilities';

export type AuxDataRuntime = {
  storage: RuntimeCapabilities['storage'];
  notifier: RuntimeNotifier;
};

export async function updateSubjectDraftFromAuxSite(
  payload: AuxSitePayload,
  runtime: AuxDataRuntime
) {
  const {
    url: auxSite,
    opts: auxSiteOpts = {},
    prefs: auxPrefs = {},
    mergeOrder = 'origin',
  } = payload;
  try {
    await runtime.notifier.notify({
      type: 'info',
      message: '正在抓取第三方网站信息…',
      link: auxSite,
      duration: 0,
    });
    console.info('the start of updating aux data');
    const auxData = await getWikiDataByURL(auxSite, auxSiteOpts);
    console.info('auxiliary data: ', auxData);
    if (!auxData || (auxData && auxData.length === 0)) {
      await runtime.notifier.notify({
        type: 'error',
        message: '未抓取到信息。请确认来源页面可访问且有资料，再重试。',
        link: auxSite,
        cmd: 'dismissNotError',
      });
    } else {
      await runtime.notifier.notify({
        type: 'info',
        message: '抓取第三方网站信息成功。',
        link: auxSite,
        cmd: 'dismissNotError',
      });
    }
    const wikiData = await runtime.storage.loadSubjectDraft();
    if (!wikiData) {
      throw new Error('wikiData is empty');
    }
    let infos = mergeOrder === 'aux'
      ? combineInfoList(auxData, wikiData.infos, auxPrefs)
      : combineInfoList(wikiData.infos, auxData, auxPrefs);
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
      message: '抓取信息失败。请确认来源页面可访问，再重试。',
      link: auxSite,
      cmd: 'dismissNotError',
    });
  }
}
