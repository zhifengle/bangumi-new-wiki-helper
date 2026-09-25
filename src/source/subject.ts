import { SubjectWikiInfo } from '../interface/subjectInfo';
import { IMsgPayload } from '../interface/types';
import { SubjectSourceDefinition } from '../interface/wiki';
import { getSubjectHooks } from '../sites';
import { appendExportBtn, insertControlBtn } from '../sites/core/controls';
import { getWikiData } from '../sites/core/extract';
import { getQueryInfo } from '../sites/core/search';
import { findElement } from '../utils/domUtils';
import { buildExportPayload, showExportDialog } from './export';
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

// 新建与导出共用同一份抽取结果，保证导出的就是会填进表单的数据
async function collectSubjectData(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter
): Promise<SubjectWikiInfo> {
  const infos = await getWikiData(siteConfig);
  await runtime.hydrateSubjectCover?.(infos);
  console.info('wiki info list: ', infos);
  return {
    type: siteConfig.type,
    subtype: siteConfig.subType || 0,
    infos,
  };
}

export async function initSourceSubject(
  siteConfig: SubjectSourceDefinition,
  runtime: SourceRuntimeAdapter
) {
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const $title = findElement(siteConfig.controlSelector);
  if (!$title) return;
  const normalizedHookRes = normalizeHookResult(
    await getSubjectHooks(siteConfig, 'beforeCreate')()
  );
  if (!normalizedHookRes) return;
  const { payload } = normalizedHookRes;
  console.info(siteConfig.description, ' content script init');
  const $controls = insertControlBtn($title, async (_e, shouldCheckDup) => {
    const wikiData = await collectSubjectData(siteConfig, runtime);
    await runtime.submitSubjectCreation({
      siteConfig,
      wikiData,
      queryInfo: getQueryInfo(wikiData.infos),
      payload,
      shouldCheckDup: !!shouldCheckDup,
    });
  });
  if (!$controls) return;
  appendExportBtn($controls, async () => {
    showExportDialog(
      buildExportPayload({
        kind: 'subject',
        site: siteConfig.key,
        sourceUrl: location.href,
        data: await collectSubjectData(siteConfig, runtime),
      })
    );
  });
}


