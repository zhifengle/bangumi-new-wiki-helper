import type {
  CharacterModelKey,
  CharacterSourceDefinition,
  SubjectModelKey,
  SubjectSourceDefinition,
} from '../interface/wiki';
import type {
  CharacterAfterGetWikiDataHook,
  CharacterIntegration,
  CharacterTools,
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
import { vgmdbIntegration } from './vgmdb';

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

const siteToolsMap = buildSiteToolsMap(siteIntegrations);
const characterToolsMap = buildCharacterToolsMap(characterIntegrations);

const noOpBeforeCreate: SubjectBeforeCreateHook = async () => true;
const noOpSubjectAfterGetWikiData: SubjectAfterGetWikiDataHook = async (
  infos
) => infos;
const noOpCharacterAfterGetWikiData: CharacterAfterGetWikiDataHook = async (
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

function getSiteTools(key: SubjectModelKey): SubjectTools | undefined {
  return siteToolsMap[key];
}

function getCharacterTools(
  key: CharacterModelKey
): CharacterTools | undefined {
  return characterToolsMap[key];
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

export function getCharacterIntegrations(
  key: SubjectModelKey
): CharacterIntegration[] {
  return characterIntegrations.filter(
    (integration) => integration.model.siteKey === key
  );
}

export function dealFuncByCategory(
  key: SubjectModelKey,
  category?: string
): (value?: string | null) => string {
  const filter = category
    ? getSiteTools(key)?.filters?.find(
        (item) => item.category === category
      )
    : undefined;
  if (filter?.dealFunc) {
    return filter.dealFunc;
  }
  return (str = '') => identity((str ?? '').trim());
}


