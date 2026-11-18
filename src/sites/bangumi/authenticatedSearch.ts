import type { SearchResult } from '../../interface/subjectInfo';
import type { SubjectTypeId } from '../../interface/wiki';
import { fetchJson, HttpStatusError } from '../../utils/fetchData';
import { APP_VERSION } from '../../version';

const API_BASE = 'https://api.bgm.tv/v0';

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

function getApiHeaders(accessToken?: string) {
  return {
    'User-Agent': `zhifengle/bangumi-new-wiki-helper/${APP_VERSION}`,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

function rethrowApiError(error: unknown): never {
  if (
    error instanceof HttpStatusError &&
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
    rethrowApiError(error);
  }
}

export async function searchAuthenticatedSubject(
  keyword: string,
  type: Exclude<SubjectTypeId, SubjectTypeId.all>,
  accessToken: string
): Promise<SearchResult[]> {
  let response: { data: SubjectHit[] };
  try {
    response = await fetchJson(`${API_BASE}/search/subjects?limit=20`, {
      method: 'POST',
      headers: { ...getApiHeaders(accessToken), 'Content-Type': 'application/json' },
      data: JSON.stringify({ keyword, sort: 'match', filter: { type: [type] } }),
    });
  } catch (error) {
    rethrowApiError(error);
  }

  if (
    !Array.isArray(response?.data) ||
    !response.data.every((hit) =>
      hit && Number.isSafeInteger(hit.id) && hit.id > 0 &&
      typeof hit.type === 'number' && typeof hit.name === 'string'
    )
  ) {
    throw new Error('Invalid Bangumi API search response');
  }
  return response.data.filter((hit) => hit.type === type).map((hit) => ({
    name: hit.name,
    greyName: hit.name_cn,
    releaseDate: hit.date ?? undefined,
    url: `/subject/${hit.id}`,
  }));
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
