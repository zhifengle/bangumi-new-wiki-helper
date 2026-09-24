import { PersonSourceDefinition } from '../interface/wiki';
import { initSourcePerson } from '../source/person';
import { contentRuntimeAdapter } from './runtimeAdapter';

export async function initPerson(model: PersonSourceDefinition) {
  return initSourcePerson(model, contentRuntimeAdapter);
}
