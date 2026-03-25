import { SiteConfig } from '../interface/wiki';
import { initSourceCharacter } from '../source/character';
import { userScriptRuntimeAdapter } from './runtimeAdapter';

export async function initChara(siteConfig: SiteConfig) {
  return initSourceCharacter(siteConfig, userScriptRuntimeAdapter);
}
