import type { SingleInfo } from '../interface/subjectInfo';
import type { IMsgPayload } from '../interface/types';
import type {
  CharacterSourceDefinition,
  PersonSourceDefinition,
  SubjectSourceDefinition,
} from '../interface/wiki';
import type { WikiExtractRoot } from './core/context';

export type SiteDealFunc = (value?: any) => string;

export type CategoryFilter = {
  category: string;
  dealFunc: SiteDealFunc;
};

export type SubjectBeforeCreateResult = boolean | { payload?: IMsgPayload };

export type SubjectBeforeCreateHook = () => Promise<SubjectBeforeCreateResult>;

export type SubjectAfterGetWikiDataHook = (
  infos: SingleInfo[],
  model?: SubjectSourceDefinition
) => Promise<SingleInfo[]>;

export type CharacterAfterGetWikiDataHook = (
  infos: SingleInfo[],
  model?: CharacterSourceDefinition,
  root?: WikiExtractRoot
) => Promise<SingleInfo[]>;

export type SubjectTools = {
  hooks?: {
    beforeCreate?: SubjectBeforeCreateHook;
    afterGetWikiData?: SubjectAfterGetWikiDataHook;
  };
  filters?: CategoryFilter[];
};

export type CharacterTools = {
  hooks?: {
    afterGetWikiData?: CharacterAfterGetWikiDataHook;
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

export type PersonBeforeCreateHook = () => Promise<boolean>;

export type PersonAfterGetWikiDataHook = (
  infos: SingleInfo[],
  model?: PersonSourceDefinition,
  root?: WikiExtractRoot
) => Promise<SingleInfo[]>;

export type PersonTools = {
  hooks?: {
    beforeCreate?: PersonBeforeCreateHook;
    afterGetWikiData?: PersonAfterGetWikiDataHook;
  };
  filters?: CategoryFilter[];
};

export type PersonIntegration = {
  model: PersonSourceDefinition;
  tools?: PersonTools;
};

export function definePersonIntegration(integration: PersonIntegration) {
  return integration;
}


