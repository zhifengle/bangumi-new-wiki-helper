import { SubjectSourceDefinition } from '../interface/wiki';
import { initSourceCharacter } from '../source/character';
import { userScriptRuntimeAdapter } from './runtimeAdapter';

export async function initChara(siteConfig: SubjectSourceDefinition) {
  return initSourceCharacter(siteConfig, userScriptRuntimeAdapter);
}

