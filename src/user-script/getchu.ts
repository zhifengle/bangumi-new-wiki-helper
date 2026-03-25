import { SiteConfig } from '../interface/wiki';
import { initGetchuCharacter } from '../source/getchuCharacter';
import { userScriptRuntimeAdapter } from './runtimeAdapter';

export const getchu = {
  init(siteConfig: SiteConfig) {
    initGetchuCharacter(siteConfig, userScriptRuntimeAdapter);
  },
};
