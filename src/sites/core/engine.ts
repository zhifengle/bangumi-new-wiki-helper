import { IFuncPromise, ITiming } from '../../interface/types';
import {
  CharaModel,
  CharaModelKey,
  ModelKey,
  SiteConfig,
} from '../../interface/wiki';
import { SiteDealFunc, SiteTools } from '../types';
import { charaToolsRegistry, siteToolsRegistry } from './registry';

const noOps: IFuncPromise = () => Promise.resolve(true);

function identity<T>(x: T): T {
  return x;
}

function resolveHook(hooks: SiteTools['hooks'] | undefined, timing: ITiming) {
  if (!hooks) return noOps;
  return hooks[timing] || noOps;
}

export function getSiteTools(key: ModelKey): SiteTools | undefined {
  return siteToolsRegistry[key];
}

export function getCharaTools(key: CharaModelKey): SiteTools | undefined {
  return charaToolsRegistry[key];
}

export function getSiteHook(siteConfig: SiteConfig, timing: ITiming): IFuncPromise {
  return resolveHook(getSiteTools(siteConfig.key)?.hooks, timing);
}

export function getCharaHook(config: CharaModel, timing: ITiming): IFuncPromise {
  return resolveHook(getCharaTools(config.key)?.hooks, timing);
}

export function getCategoryDealFunc(
  key: ModelKey,
  category: string
): SiteDealFunc {
  const filter = getSiteTools(key)?.filters?.find(
    (item) => item.category === category
  );
  if (filter?.dealFunc) {
    return filter.dealFunc;
  }
  return (str = '') => identity((str ?? '').trim());
}
