import {
  getStringValue,
  PersonWikiInfo,
  SingleInfo,
} from '../interface/subjectInfo';
import { PersonSourceDefinition } from '../interface/wiki';
import { getPersonHooks } from '../sites';
import { createWikiExtractContext } from '../sites/core/context';
import {
  appendExportBtn,
  ControlButtonLabels,
  insertControlBtn,
} from '../sites/core/controls';
import { getPersonData } from '../sites/core/extract';
import { findElement } from '../utils/domUtils';
import { buildExportPayload, showExportDialog } from './export';
import { SourceRuntimeAdapter } from './runtime';

const PERSON_BUTTON_LABELS: ControlButtonLabels = {
  create: '新建人物',
  createWithCheck: '新建人物并查重',
};

// 站点 hook 没给的项才补默认值：人物类型下拉、职业勾选、引用来源
function withDefaults(
  infos: SingleInfo[],
  model: PersonSourceDefinition
): SingleInfo[] {
  const res = [...infos];
  if (model.role !== undefined && !res.some((info) => info.name === 'crt_role')) {
    res.push({ name: 'crt_role', value: String(model.role), category: 'select' });
  }
  if (!res.some((info) => info.category === 'checkbox')) {
    for (const profession of model.professions ?? []) {
      res.push({
        name: `prsn_pro[${profession}]`,
        value: true,
        category: 'checkbox',
      });
    }
  }
  if (!res.some((info) => info.name === '引用来源')) {
    // 只记页面本身的地址，去掉查询串与锚点
    res.push({
      name: '引用来源',
      value: location.origin + location.pathname,
      category: 'listItem',
    });
  }
  return res;
}

function getPersonName(infos: SingleInfo[]): string {
  return getStringValue(
    infos.find((info) => info.category === 'crt_name')?.value
  ).trim();
}

async function collectPersonData(
  model: PersonSourceDefinition,
  runtime: SourceRuntimeAdapter
): Promise<PersonWikiInfo> {
  const infos = withDefaults(
    await getPersonData(model, createWikiExtractContext(document)),
    model
  );
  // 人物允许没有肖像；补抓失败只降级为不带图，不中断新建
  try {
    await runtime.hydratePersonCover?.(infos);
  } catch (error) {
    console.warn('person portrait hydration failed, continuing without it:', error);
  }
  console.info('person info list: ', infos);
  return { infos };
}

export async function initSourcePerson(
  model: PersonSourceDefinition,
  runtime: SourceRuntimeAdapter
) {
  const $page = findElement(model.pageSelectors);
  if (!$page) return;
  const $control = findElement(model.controlSelector);
  if (!$control) return;
  const canCreate = await getPersonHooks(model, 'beforeCreate')();
  if (!canCreate) return;
  console.info(model.description, ' person content script init');
  const $controls = insertControlBtn(
    $control,
    async (_e, shouldCheckDup) => {
      const personData = await collectPersonData(model, runtime);
      await runtime.submitPersonCreation({
        siteConfig: model,
        personData,
        queryInfo: { name: getPersonName(personData.infos) },
        shouldCheckDup: !!shouldCheckDup,
      });
    },
    PERSON_BUTTON_LABELS
  );
  if (!$controls) return;
  appendExportBtn($controls, async () => {
    showExportDialog(
      buildExportPayload({
        kind: 'person',
        site: model.key,
        sourceUrl: location.href,
        data: await collectPersonData(model, runtime),
      })
    );
  });
}
