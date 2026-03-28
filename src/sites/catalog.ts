import { IFuncPromise, ITiming } from '../interface/types';
import { CharacterSourceDefinition, CharaModelKey, ModelKey, SubjectSourceDefinition } from '../interface/wiki';
import { SiteTools } from './catalogTypes';
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
import type { CharaIntegration, SiteIntegration } from './catalogTypes';
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

const charaIntegrations = siteIntegrations.flatMap(
  (integration) => integration.charas ?? []
);

function buildSiteToolsMap(integrations: SiteIntegration[]) {
  return integrations.reduce((acc, integration) => {
    if (integration.tools) {
      acc[integration.site.key] = integration.tools;
    }
    return acc;
  }, {} as Partial<Record<ModelKey, SiteTools>>);
}

function buildCharaToolsMap(integrations: CharaIntegration[]) {
  return integrations.reduce((acc, integration) => {
    if (integration.tools) {
      acc[integration.model.key] = integration.tools;
    }
    return acc;
  }, {} as Partial<Record<CharaModelKey, SiteTools>>);
}

const siteToolsMap = buildSiteToolsMap(siteIntegrations);
const charaToolsMap = buildCharaToolsMap(charaIntegrations);

const noOps: IFuncPromise = () => Promise.resolve(true);

function identity<T>(x: T): T {
  return x;
}

function resolveHook(hooks: SiteTools['hooks'] | undefined, timing: ITiming) {
  if (!hooks) return noOps;
  return hooks[timing] || noOps;
}

export function findModelByHost(host: string): SubjectSourceDefinition[] {
  return siteIntegrations
    .map((integration) => integration.site)
    .filter((model) => model.host.includes(host));
}

export function getCharaModel(key: ModelKey): CharacterSourceDefinition {
  const target = charaIntegrations.find(
    (integration) => integration.model.siteKey === key
  );
  if (!target) return null;
  return target.model;
}

function getSiteTools(key: ModelKey): SiteTools | undefined {
  return siteToolsMap[key];
}

function getCharaTools(key: CharaModelKey): SiteTools | undefined {
  return charaToolsMap[key];
}

export function getHooks(
  siteConfig: SubjectSourceDefinition,
  timing: ITiming
): IFuncPromise {
  return resolveHook(getSiteTools(siteConfig.key)?.hooks, timing);
}

export function getCharaHooks(
  config: CharacterSourceDefinition,
  timing: ITiming
): IFuncPromise {
  return resolveHook(getCharaTools(config.key)?.hooks, timing);
}

export function dealFuncByCategory(
  key: ModelKey,
  category: string
): (value?: string | null) => string {
  const filter = getSiteTools(key)?.filters?.find(
    (item) => item.category === category
  );
  if (filter?.dealFunc) {
    return filter.dealFunc;
  }
  return (str = '') => identity((str ?? '').trim());
}


