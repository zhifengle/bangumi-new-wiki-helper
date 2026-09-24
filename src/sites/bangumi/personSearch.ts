import { SearchResult } from '../../interface/subjectInfo';
import { fetchJson } from '../../utils/fetchData';

// 人物查重走新版 API，匿名即可调用，与 bgm.tv / chii.in 的站点域名无关
export const BANGUMI_API_HOST = 'https://api.bgm.tv';

type PersonSearchHit = {
  id: number | string;
  name: string;
  name_cn?: string;
};

type PersonSearchResponse = {
  data?: unknown;
} | null;

export type PersonSearchOptions = {
  apiHost?: string;
  limit?: number;
};

function isPersonSearchHit(value: unknown): value is PersonSearchHit {
  if (!value || typeof value !== 'object') return false;
  const hit = value as Partial<PersonSearchHit>;
  return (
    (typeof hit.id === 'number' || typeof hit.id === 'string') &&
    typeof hit.name === 'string'
  );
}

export async function searchPersonCandidates(
  name: string,
  options: PersonSearchOptions = {}
): Promise<SearchResult[]> {
  const keyword = name.trim();
  if (!keyword) {
    return [];
  }
  const { apiHost = BANGUMI_API_HOST, limit = 10 } = options;
  const response = await fetchJson<PersonSearchResponse>(
    `${apiHost}/v0/search/persons?limit=${limit}`,
    {
      method: 'POST',
      data: JSON.stringify({ keyword }),
      headers: { 'Content-Type': 'application/json' },
    }
  );
  const hits = Array.isArray(response?.data) ? response.data : [];
  return hits.filter(isPersonSearchHit).map((hit) => ({
    name: hit.name,
    greyName: hit.name_cn ?? '',
    url: `/person/${hit.id}`,
  }));
}
