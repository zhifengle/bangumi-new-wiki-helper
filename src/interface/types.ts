import { SubjectTypeId } from './wiki';

export type IFuncPromise<
  Args extends unknown[] = unknown[],
  Result = unknown,
> = (...args: Args) => Promise<Result>;
export type ITiming = 'beforeCreate' | 'afterGetWikiData';

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

export type IFetchOpts = RequestInit & {
  cookie?: string;
  data?: BodyInit | null;
  // EUC-JP 部分网页编码
  decode?: string;
};

export type IAuxPrefs = {
  originNames?: string[] | 'all';
  targetNames?: string[] | 'all';
};

export type AuxSitePayload = {
  url: string;
  opts?: IFetchOpts;
  prefs?: IAuxPrefs;
};

export type IMsgPayload = {
  url?: string;
  type?: SubjectTypeId;
  fileType?: string;
  auxPrefs?: IAuxPrefs;
  disableDate?: boolean;
  auxSite?: AuxSitePayload;
};

export type LogCommand = 'dismissAll' | 'dismissNotError';

export type LogMsg = {
  type: 'succuss' | 'info' | 'error';
  message: string;
  duration?: number;
  cmd?: LogCommand;
};

export type MusicDiscTrack = {
  title: string;
  cnTitle?: string;
  number: string;
  duration?: string;
  discNumber: string;
}
