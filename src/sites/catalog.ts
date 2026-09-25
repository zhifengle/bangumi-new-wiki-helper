import type {
  CharacterModelKey,
  CharacterSourceDefinition,
  ModelKey,
  PersonModelKey,
  PersonSourceDefinition,
  SubjectModelKey,
  SubjectSourceDefinition,
} from '../interface/wiki';
import type {
  CategoryFilter,
  CharacterAfterGetWikiDataHook,
  CharacterIntegration,
  CharacterTools,
  PersonAfterGetWikiDataHook,
  PersonBeforeCreateHook,
  PersonIntegration,
  PersonTools,
  SubjectAfterGetWikiDataHook,
  SubjectBeforeCreateHook,
  SubjectTools,
} from './catalogTypes';
import { adultcomicIntegration } from './adultcomic';
import { amazonJpBookIntegration } from './amazonJpBook';
import { amazonJpMusicIntegration } from './amazonJpMusic';
import { dangdangBookIntegration } from './dangdangBook';
import { dlsiteIntegration } from './dlsite';
import { dmmIntegration } from './dmm';
import { doubanGameIntegration } from './doubanGame';
import { doubanGameEditIntegration } from './doubanGameEdit';
import { doubanMusicIntegration } from './doubanMusic';
import { erogamescapeIntegration } from './erogamescape';
import { getchuIntegration } from './getchu';
import { jdBookIntegration } from './jdBook';
import { moepediaIntegration } from './moepedia';
import { steamIntegration } from './steam';
import { steamdbIntegration } from './steamdb';
import type { SiteIntegration } from './catalogTypes';
import {
  vgmdbArtistIntegration,
  vgmdbIntegration,
  vgmdbOrgIntegration,
} from './vgmdb';

const siteIntegrations: SiteIntegration[] = [
  getchuIntegration,
  dlsiteIntegration,
  dmmIntegration,
  amazonJpBookIntegration,
  amazonJpMusicIntegration,
  dangdangBookIntegration,
  jdBookIntegration,
  doubanGameIntegration,
  doubanGameEditIntegration,
  doubanMusicIntegration,
  erogamescapeIntegration,
  steamIntegration,
  steamdbIntegration,
  adultcomicIntegration,
  moepediaIntegration,
  vgmdbIntegration,
];

const characterIntegrations = siteIntegrations.flatMap(
  (integration) => integration.characters ?? []
);

// 人物页面来源独立于条目站点注册，方便接入没有条目模型的站点。
const personIntegrations: PersonIntegration[] = [
  vgmdbArtistIntegration,
  vgmdbOrgIntegration,
];

function buildSiteToolsMap(integrations: SiteIntegration[]) {
  return integrations.reduce((acc, integration) => {
    if (integration.tools) {
      acc[integration.site.key] = integration.tools;
    }
    return acc;
  }, {} as Partial<Record<SubjectModelKey, SubjectTools>>);
}

function buildCharacterToolsMap(integrations: CharacterIntegration[]) {
  return integrations.reduce((acc, integration) => {
    if (integration.tools) {
      acc[integration.model.key] = integration.tools;
    }
    return acc;
  }, {} as Partial<Record<CharacterModelKey, CharacterTools>>);
}

function buildPersonToolsMap(integrations: PersonIntegration[]) {
  return integrations.reduce((acc, integration) => {
    if (integration.tools) {
      acc[integration.model.key] = integration.tools;
    }
    return acc;
  }, {} as Partial<Record<PersonModelKey, PersonTools>>);
}

// 条目与人物模型的 category 过滤器合并成一张按 ModelKey 索引的表，
// 供核心抽取层按任意模型 key 查询。
function buildFiltersMap(
  sites: SiteIntegration[],
  persons: PersonIntegration[]
) {
  const acc: Partial<Record<ModelKey, CategoryFilter[]>> = {};
  for (const integration of sites) {
    if (integration.tools?.filters) {
      acc[integration.site.key] = integration.tools.filters;
    }
  }
  for (const integration of persons) {
    if (integration.tools?.filters) {
      acc[integration.model.key] = integration.tools.filters;
    }
  }
  return acc;
}

const siteToolsMap = buildSiteToolsMap(siteIntegrations);
const characterToolsMap = buildCharacterToolsMap(characterIntegrations);
const personToolsMap = buildPersonToolsMap(personIntegrations);
const filtersMap = buildFiltersMap(siteIntegrations, personIntegrations);

const noOpBeforeCreate: SubjectBeforeCreateHook = async () => true;
const noOpSubjectAfterGetWikiData: SubjectAfterGetWikiDataHook = async (
  infos
) => infos;
const noOpCharacterAfterGetWikiData: CharacterAfterGetWikiDataHook = async (
  infos
) => infos;
const noOpPersonBeforeCreate: PersonBeforeCreateHook = async () => true;
const noOpPersonAfterGetWikiData: PersonAfterGetWikiDataHook = async (
  infos
) => infos;

function identity<T>(x: T): T {
  return x;
}

export function findModelByHost(host: string): SubjectSourceDefinition[] {
  return siteIntegrations
    .map((integration) => integration.site)
    .filter((model) => model.host.includes(host));
}

export function getCharacterModels(
  key: SubjectModelKey
): CharacterSourceDefinition[] {
  return characterIntegrations
    .filter(
      (integration) => integration.model.siteKey === key
    )
    .map((integration) => integration.model);
}

// host 命中且 urlRules（若有）命中当前页面地址的人物模型
export function findPersonModels(
  host: string,
  href: string
): PersonSourceDefinition[] {
  return personIntegrations
    .map((integration) => integration.model)
    .filter((model) => model.host.includes(host))
    .filter(
      (model) =>
        !model.urlRules?.length ||
        model.urlRules.some((rule) => rule.test(href))
    );
}

function getSiteTools(key: SubjectModelKey): SubjectTools | undefined {
  return siteToolsMap[key];
}

function getCharacterTools(
  key: CharacterModelKey
): CharacterTools | undefined {
  return characterToolsMap[key];
}

function getPersonTools(key: PersonModelKey): PersonTools | undefined {
  return personToolsMap[key];
}

export function getSubjectHooks(
  siteConfig: SubjectSourceDefinition,
  timing: 'beforeCreate'
): SubjectBeforeCreateHook;
export function getSubjectHooks(
  siteConfig: SubjectSourceDefinition,
  timing: 'afterGetWikiData'
): SubjectAfterGetWikiDataHook;
export function getSubjectHooks(
  siteConfig: SubjectSourceDefinition,
  timing: 'beforeCreate' | 'afterGetWikiData'
) {
  const hooks = getSiteTools(siteConfig.key)?.hooks;
  if (!hooks) {
    return timing === 'beforeCreate'
      ? noOpBeforeCreate
      : noOpSubjectAfterGetWikiData;
  }
  return hooks[timing] || (
    timing === 'beforeCreate'
      ? noOpBeforeCreate
      : noOpSubjectAfterGetWikiData
  );
}

export function getCharacterHooks(
  config: CharacterSourceDefinition,
  timing: 'afterGetWikiData' = 'afterGetWikiData'
): CharacterAfterGetWikiDataHook {
  const hooks = getCharacterTools(config.key)?.hooks;
  if (!hooks) {
    return noOpCharacterAfterGetWikiData;
  }
  return hooks[timing] || noOpCharacterAfterGetWikiData;
}

export function getPersonHooks(
  model: PersonSourceDefinition,
  timing: 'beforeCreate'
): PersonBeforeCreateHook;
export function getPersonHooks(
  model: PersonSourceDefinition,
  timing: 'afterGetWikiData'
): PersonAfterGetWikiDataHook;
export function getPersonHooks(
  model: PersonSourceDefinition,
  timing: 'beforeCreate' | 'afterGetWikiData'
) {
  const hooks = getPersonTools(model.key)?.hooks;
  const fallback =
    timing === 'beforeCreate'
      ? noOpPersonBeforeCreate
      : noOpPersonAfterGetWikiData;
  return hooks?.[timing] || fallback;
}

export function getCharacterIntegrations(
  key: SubjectModelKey
): CharacterIntegration[] {
  return characterIntegrations.filter(
    (integration) => integration.model.siteKey === key
  );
}

export function dealFuncByCategory(
  key: ModelKey,
  category?: string
): (value?: string | null) => string {
  const filter = category
    ? filtersMap[key]?.find((item) => item.category === category)
    : undefined;
  if (filter?.dealFunc) {
    return filter.dealFunc;
  }
  return (str = '') => identity((str ?? '').trim());
}


