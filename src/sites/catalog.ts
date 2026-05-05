import type {
  CharacterModelKey,
  CharacterSourceDefinition,
  SubjectModelKey,
  SubjectSourceDefinition,
} from '../interface/wiki';
import type {
  CharacterIntegration,
  CharacterTools,
  SubjectBeforeCreateHook,
  SubjectTools,
} from './catalogTypes';
import type { FinalizeHook } from './core/extraction';
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
const noOpFinalize: FinalizeHook = async (infos) => infos;

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
  timing: 'finalize'
): FinalizeHook;
export function getSubjectHooks(
  siteConfig: SubjectSourceDefinition,
  timing: 'beforeCreate' | 'finalize'
) {
  const hooks = getSiteTools(siteConfig.key)?.hooks;
  if (timing === 'finalize' && siteConfig.finalize) {
    return siteConfig.finalize;
  }
  if (!hooks) {
    return timing === 'beforeCreate'
      ? noOpBeforeCreate
      : noOpFinalize;
  }
  return hooks[timing] || (
    timing === 'beforeCreate'
      ? noOpBeforeCreate
      : noOpFinalize
  );
}

export function getCharacterHooks(
  config: CharacterSourceDefinition,
  timing: 'finalize' = 'finalize'
): FinalizeHook {
  if (config.finalize) {
    return config.finalize;
  }
  const hooks = getCharacterTools(config.key)?.hooks;
  if (!hooks) {
    return noOpFinalize;
  }
  return hooks[timing] || noOpFinalize;
}

export function getCharacterIntegrations(
  key: SubjectModelKey
): CharacterIntegration[] {
  return characterIntegrations.filter(
    (integration) => integration.model.siteKey === key
  );
}


