import type { SearchResult } from '../../interface/subjectInfo';
import type { SubjectTypeId } from '../../interface/wiki';
import { fetchJson, HttpStatusError } from '../../utils/fetchData';
import { getTitleRetryQuery } from '../core/subjectTitle';

const API_BASE = 'https://api.bgm.tv/v0';
const SEARCH_PAGE_SIZE = 20;
const BROWSE_PAGE_SIZE = 50;

export class BangumiAccessTokenError extends Error {
  constructor() {
    super('Bangumi rejected the configured access token');
    this.name = 'BangumiAccessTokenError';
  }
}

type SubjectHit = {
  id: number;
  type: number;
  name: string;
  name_cn: string;
  date?: string | null;
};

type SubjectPage = {
  total?: number;
  limit?: number;
  offset?: number;
  data: SubjectHit[];
};

function getApiHeaders(accessToken?: string) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function rethrowApiError(error: unknown, accessToken: string | undefined): never {
  if (
    accessToken && error instanceof HttpStatusError &&
    (error.status === 401 || error.status === 403)
  ) {
    throw new BangumiAccessTokenError();
  }
  throw error;
}

export async function verifyBangumiAccessToken(accessToken: string) {
  try {
    const account = await fetchJson<{ id: number }>(`${API_BASE}/me`, {
      headers: getApiHeaders(accessToken),
    });
    if (!Number.isSafeInteger(account?.id) || account.id <= 0) {
      throw new Error('Invalid Bangumi account response');
    }
  } catch (error) {
    rethrowApiError(error, accessToken);
  }
}

async function collectSubjectPages(
  type: SubjectTypeId,
  pageSize: number,
  accessToken: string | undefined,
  fetchPage: (offset: number) => Promise<SubjectPage>
): Promise<SearchResult[]> {
  const candidates: SearchResult[] = [];
  let offset = 0;
  for (;;) {
    let page: SubjectPage;
    try {
      page = await fetchPage(offset);
    } catch (error) {
      rethrowApiError(error, accessToken);
    }
    if (
      !Array.isArray(page?.data) ||
      (page.offset !== undefined && page.offset !== offset) ||
      (page.total !== undefined && (!Number.isSafeInteger(page.total) || page.total < 0)) ||
      (page.limit !== undefined && (!Number.isSafeInteger(page.limit) || page.limit <= 0)) ||
      !page.data.every((hit) =>
        hit && Number.isSafeInteger(hit.id) && hit.id > 0 &&
        typeof hit.type === 'number' && typeof hit.name === 'string'
      )
    ) {
      throw new Error('Invalid Bangumi API search response');
    }
    for (const hit of page.data) {
      if (hit.type === type) {
        candidates.push({
          name: hit.name,
          greyName: hit.name_cn,
          releaseDate: hit.date ?? undefined,
          url: `/subject/${hit.id}`,
        });
      }
    }

    offset += page.limit ?? pageSize;
    if (!page.data.length || offset >= (page.total ?? offset)) return candidates;
  }
}

function searchTitlePages(keyword: string, type: SubjectTypeId, accessToken?: string) {
  const headers = { ...getApiHeaders(accessToken), 'Content-Type': 'application/json' };
  const data = JSON.stringify({ keyword, sort: 'match', filter: { type: [type] } });
  return collectSubjectPages(type, SEARCH_PAGE_SIZE, accessToken, (offset) => {
    const url = `${API_BASE}/search/subjects?limit=${SEARCH_PAGE_SIZE}${offset ? `&offset=${offset}` : ''}`;
    return fetchJson(url, { method: 'POST', headers, data });
  });
}

export function browseSubjectsByDate(
  type: Exclude<SubjectTypeId, SubjectTypeId.all>,
  { year, month }: { year: number; month?: number },
  accessToken?: string
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ type: String(type), year: String(year) });
  if (month !== undefined) params.set('month', String(month));
  params.set('sort', 'date');
  params.set('limit', String(BROWSE_PAGE_SIZE));
  const headers = getApiHeaders(accessToken);
  return collectSubjectPages(type, BROWSE_PAGE_SIZE, accessToken, (offset) =>
    fetchJson(`${API_BASE}/subjects?${params}&offset=${offset}`, { headers })
  );
}

export async function searchSubjectsByTitle(
  keyword: string,
  type: Exclude<SubjectTypeId, SubjectTypeId.all>,
  name: string,
  accessToken?: string
): Promise<SearchResult[]> {
  // 后续可用 browseSubjectsByDate 补查关键词索引漏项。
  const candidates = await searchTitlePages(keyword, type, accessToken);
  const retryQuery = getTitleRetryQuery(candidates, name);
  if (retryQuery && retryQuery !== keyword) {
    candidates.push(...await searchTitlePages(retryQuery, type, accessToken));
  }
  return candidates;
}

export async function getSubjectISBNs(
  subjectId: string,
  accessToken?: string
): Promise<string[]> {
  const response = await fetchJson<{ infobox?: { key: string; value: unknown }[] }>(
    `${API_BASE}/subjects/${subjectId}`,
    { headers: getApiHeaders(accessToken) }
  );
  return (response?.infobox ?? []).flatMap(({ key, value }) =>
    /^ISBN(?:[ -]?(?:10|13))?$/i.test(key.trim()) && typeof value === 'string'
      ? [value]
      : []
  );
}
