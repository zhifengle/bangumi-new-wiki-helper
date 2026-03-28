import { IFuncPromise, ITiming } from '../../interface/types';
import { CharaModel, CharaModelKey, ModelKey, SiteConfig } from '../../interface/wiki';
import { SiteDealFunc, SiteTools } from '../types';
import { getCategoryDealFunc, getCharaHook, getSiteHook } from './engine';
import { charaToolsRegistry, siteToolsRegistry } from './registry';
import { trimParenthesis } from './trim';

export { trimParenthesis };

export const sitesFuncDict: {
  [key in ModelKey]?: SiteTools;
} = siteToolsRegistry;

// 存储新建角色的钩子函数和 filters
export const charaFuncDict: {
  [key in CharaModelKey]?: SiteTools;
} = charaToolsRegistry;

export function getHooks(siteConfig: SiteConfig, timing: ITiming): IFuncPromise {
  return getSiteHook(siteConfig, timing);
}

export function getCharaHooks(config: CharaModel, timing: ITiming): IFuncPromise {
  return getCharaHook(config, timing);
}

export function dealFuncByCategory(
  key: ModelKey,
  category: string
): SiteDealFunc {
  return getCategoryDealFunc(key, category);
}
