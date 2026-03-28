import { SubjectSourceDefinition } from '../interface/wiki';
import { initSourceCharacter } from '../source/character';
import { contentRuntimeAdapter } from './runtimeAdapter';

export async function initChara(siteConfig: SubjectSourceDefinition) {
  return initSourceCharacter(siteConfig, contentRuntimeAdapter);
}

