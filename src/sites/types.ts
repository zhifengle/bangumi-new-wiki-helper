import { IFuncPromise, IMsgPayload } from '../interface/types';

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
