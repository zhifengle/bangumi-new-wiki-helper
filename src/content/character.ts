import { SiteConfig } from '../interface/wiki';
import { initSourceCharacter } from '../source/character';
import { contentRuntimeAdapter } from './runtimeAdapter';

export async function initChara(siteConfig: SiteConfig) {
  return initSourceCharacter(siteConfig, contentRuntimeAdapter);
}
