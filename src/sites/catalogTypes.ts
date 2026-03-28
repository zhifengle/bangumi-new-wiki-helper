import { IFuncPromise, IMsgPayload } from '../interface/types';
import { CharacterSourceDefinition, SubjectSourceDefinition } from '../interface/wiki';

export type SiteDealFunc = (value?: string | null) => string;

export type SiteTools = {
  hooks?: {
    // beforeCreate return Prommise<boolean>
    beforeCreate?: () => Promise<boolean | { payload?: IMsgPayload }>;
    afterGetWikiData?: IFuncPromise;
  };
  filters?: {
    category: string;
    dealFunc: SiteDealFunc;
  }[];
};

export type CharaIntegration = {
  model: CharacterSourceDefinition;
  tools?: SiteTools;
};

export type SiteIntegration = {
  site: SubjectSourceDefinition;
  tools?: SiteTools;
  charas?: CharaIntegration[];
};

export function defineSiteIntegration(integration: SiteIntegration) {
  return integration;
}


