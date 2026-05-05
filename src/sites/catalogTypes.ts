import type { SingleInfo } from '../interface/subjectInfo';
import type { IMsgPayload } from '../interface/types';
import type {
  CharacterSourceDefinition,
  SubjectSourceDefinition,
} from '../interface/wiki';
import type { FinalizeHook } from './core/extraction';

export type SubjectBeforeCreateResult = boolean | { payload?: IMsgPayload };

export type SubjectBeforeCreateHook = () => Promise<SubjectBeforeCreateResult>;

export type SubjectTools = {
  hooks?: {
    beforeCreate?: SubjectBeforeCreateHook;
    finalize?: FinalizeHook;
  };
};

export type CharacterTools = {
  hooks?: {
    finalize?: FinalizeHook;
  };
};

export type CharacterIntegration = {
  model: CharacterSourceDefinition;
  tools?: CharacterTools;
};

export type SiteIntegration = {
  site: SubjectSourceDefinition;
  tools?: SubjectTools;
  characters?: CharacterIntegration[];
};

export function defineSiteIntegration(integration: SiteIntegration) {
  return integration;
}


