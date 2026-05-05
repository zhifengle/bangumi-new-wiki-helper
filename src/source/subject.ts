import { SubjectWikiInfo } from '../interface/subjectInfo';
import { IMsgPayload } from '../interface/types';
import { SubjectSourceDefinition } from '../interface/wiki';
import { getSubjectHooks } from '../sites';
import { insertControlBtn } from '../sites/core/controls';
import { getWikiData } from '../sites/core/extract';
import { locateSource } from '../sites/core/extraction';
import { getQueryInfo } from '../sites/core/search';
import { SourceRuntimeAdapter } from './runtime';

function normalizeHookResult(
  hookRes: boolean | { payload?: IMsgPayload }
): false | { payload: IMsgPayload } {
  if (!hookRes) {
    return false;
  }
  if (hookRes === true) {
    return {
      payload: {},
    };
  }
  return {
    payload: hookRes.payload || {},
  };
}

export async function initSourceSubject(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter
) {
  const $page = locateSource(siteConfig.pageSource, { site: siteConfig.key });
  if (!$page) return;
  const $title = locateSource(siteConfig.controlSource, { site: siteConfig.key });
  if (!$title) return;
  const normalizedHookRes = normalizeHookResult(
    await getSubjectHooks(siteConfig, 'beforeCreate')()
  );
  if (!normalizedHookRes) return;
  const { payload } = normalizedHookRes;
  console.info(siteConfig.description, ' content script init');
  insertControlBtn(Array.isArray($title) ? $title[0] : $title, async (_e, shouldCheckDup) => {
    const infos = await getWikiData(siteConfig);
    await runtime.hydrateSubjectCover?.(infos);
    console.info('wiki info list: ', infos);
    const wikiData: SubjectWikiInfo = {
      type: siteConfig.type,
      subtype: siteConfig.subType || 0,
      infos,
    };
    await runtime.submitSubjectCreation({
      siteConfig,
      wikiData,
      queryInfo: getQueryInfo(infos),
      payload,
      shouldCheckDup: !!shouldCheckDup,
    });
  });
}


