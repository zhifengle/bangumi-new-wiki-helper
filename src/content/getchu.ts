import { SiteConfig } from '../interface/wiki';
import { initGetchuCharacter } from '../source/getchuCharacter';
import { contentRuntimeAdapter } from './runtimeAdapter';

export const getchu = {
  init(siteConfig: SiteConfig) {
    initGetchuCharacter(siteConfig, contentRuntimeAdapter);
  },
};
