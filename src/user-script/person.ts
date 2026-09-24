import { PersonSourceDefinition } from '../interface/wiki';
import { initSourcePerson } from '../source/person';
import { userScriptRuntimeAdapter } from './runtimeAdapter';

export async function initPerson(model: PersonSourceDefinition) {
  return initSourcePerson(model, userScriptRuntimeAdapter);
}
