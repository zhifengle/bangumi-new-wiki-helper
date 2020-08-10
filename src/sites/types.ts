import { IFuncPromise, ITiming } from '../interface/types';

export type SiteTools = {
  hooks?: {
    // beforeCreate return Prommise<boolean>
    [key in ITiming]?: IFuncPromise;
  };
  filters?: {
    category: string;
    dealFunc: (...args: any) => string;
  }[];
};

export type IAuxPrefs = {
  originNames?: string[] | 'all';
  targetNames?: string[] | 'all';
};
