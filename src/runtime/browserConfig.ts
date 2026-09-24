import { PersonWikiInfo, SubjectWikiInfo } from '../interface/subjectInfo';
import { BangumiDomain } from '../sites/bangumi';

export type BrowserConfig = {
  domain: BangumiDomain;
  activeOpen: boolean;
  useHttps: boolean;
  autoFill: boolean;
  fallbackToWebSearch: boolean;
  subjectId: string | number;
};

export type BrowserStorageState = {
  version?: string;
  config?: Partial<BrowserConfig> | null;
  wikiData?: SubjectWikiInfo | null;
  charaData?: SubjectWikiInfo | null;
  personData?: PersonWikiInfo | null;
};

export const BANGUMI_DOMAIN_OPTIONS = [
  BangumiDomain.bangumi,
  BangumiDomain.bgm,
  BangumiDomain.chii,
] as const;

export const DEFAULT_BROWSER_CONFIG: BrowserConfig = {
  domain: BangumiDomain.bgm,
  activeOpen: false,
  useHttps: true,
  autoFill: false,
  fallbackToWebSearch: false,
  subjectId: 0,
};

export function normalizeBrowserConfig(
  config?: Partial<BrowserConfig> | null
): BrowserConfig {
  return {
    ...DEFAULT_BROWSER_CONFIG,
    ...config,
  };
}

export function buildBangumiHost(
  config: Pick<BrowserConfig, 'domain' | 'useHttps'>
) {
  const protocol = config.useHttps ? 'https' : 'http';
  return `${protocol}://${config.domain}`;
}

