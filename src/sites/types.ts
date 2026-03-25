import { IFuncPromise, IMsgPayload } from '../interface/types';

export type SiteTools = {
  hooks?: {
    // beforeCreate return Prommise<boolean>
    beforeCreate?: () => Promise<boolean | { payload?: IMsgPayload }>;
    afterGetWikiData?: IFuncPromise;
  };
  filters?: {
    category: string;
    dealFunc: (...args: any) => string;
  }[];
};
