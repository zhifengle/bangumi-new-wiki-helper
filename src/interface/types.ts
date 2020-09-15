export type IFuncPromise = (...args: any) => Promise<any>;
export type ITiming = 'beforeCreate' | 'afterCreate' | 'afterGetWikiData';

export interface SubjectItem {
  name: string;
  url: string;
  rawInfos: string;
  rank?: string;
  releaseDate?: string;
  greyName?: string;
  cover?: string;
  rateInfo?: {
    score?: number | string;
    count?: number | string;
  };
  collectInfo?: {
    date: string;
    score?: string;
    tags?: string;
    comment?: string;
  };
}
