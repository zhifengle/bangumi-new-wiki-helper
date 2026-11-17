import type { SearchResult, SubjectQueryInfo } from '../../interface/subjectInfo';
import type { SubjectTypeId } from '../../interface/wiki';
import { fetchJson, HttpStatusError } from '../../utils/fetchData';
import { isEqualDate } from '../../utils/utils';
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

function normalizeName(name: string) {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export async function searchAuthenticatedSubject(
  keyword: string,
  subjectInfo: SubjectQueryInfo,
  type: Exclude<SubjectTypeId, SubjectTypeId.all>,
  accessToken: string
): Promise<SearchResult | undefined> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'User-Agent': `zhifengle/bangumi-new-wiki-helper/${APP_VERSION}`,
  };

  let response: { data: SubjectHit[] };
  try {
    // Search accepts anonymous requests, so a successful search alone does not
    // establish that Bangumi accepted the token.
    await fetchJson(`${API_BASE}/me`, { headers });
    response = await fetchJson(`${API_BASE}/search/subjects?limit=20`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      data: JSON.stringify({ keyword, sort: 'match', filter: { type: [type] } }),
    });
  } catch (error) {
    if (
      error instanceof HttpStatusError &&
      (error.status === 401 || error.status === 403)
    ) {
      throw new BangumiAccessTokenError();
    }
    throw error;
  }

  if (!Array.isArray(response?.data)) {
    throw new Error('Invalid Bangumi API search response');
  }
  const name = normalizeName(keyword);
  const matches = response.data.filter(
    (hit) =>
      hit.type === type &&
      Number.isSafeInteger(hit.id) &&
      [hit.name, hit.name_cn].some(
        (title) => typeof title === 'string' && normalizeName(title) === name
      )
  );
  const hit = matches.find(
    ({ date }) =>
      date && subjectInfo.releaseDate && isEqualDate(date, subjectInfo.releaseDate)
  );
  const match = hit ?? matches[0];
  if (match) {
    return {
      name: match.name,
      greyName: match.name_cn,
      releaseDate: match.date ?? undefined,
      url: `/subject/${match.id}`,
    };
  }
}
