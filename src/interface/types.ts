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

export type IFetchOpts = {
  method?: string;
  body?: any;
  // EUC-JP 部分网页编码
  decode?: string;
  [key: string]: any;
};

export type IAuxPrefs = {
  originNames?: string[] | 'all';
  targetNames?: string[] | 'all';
};

export type IMsgPayload = {
  url?: string;
  // SubjectTypeId or string;
  type?: any;
  fileType?: string;
  auxPrefs?: IAuxPrefs;
  disableDate?: boolean;
  auxSite?: {
    url: string;
    opts?: IFetchOpts;
    prefs?: IAuxPrefs;
  };
  [key: string]: any;
};

export type ExtMsg = {
  action: string;
  payload?: IMsgPayload;
};
