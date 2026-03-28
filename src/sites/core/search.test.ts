import { SearchResult } from '../../interface/subjectInfo';
import { filterResults, getQueryInfo } from './search';

type FuseCtor = new <T>(
  list: readonly T[],
  options?: Record<string, unknown>
) => {
  search(pattern: string): Array<{ item: T }>;
};

const globalWithFuse = globalThis as typeof globalThis & {
  Fuse?: FuseCtor;
};

const originalFuse = globalWithFuse.Fuse;

class FakeFuse<T extends Record<string, unknown>> {
  constructor(
    private readonly list: readonly T[],
    private readonly options: Record<string, unknown> = {}
  ) {}

  search(pattern: string) {
    const keys = Array.isArray(this.options.keys)
      ? this.options.keys.filter((key): key is string => typeof key === 'string')
      : [];
    return this.list
      .filter((item) =>
        keys.some((key) => String(item[key] ?? '').includes(pattern))
      )
      .map((item) => ({ item }));
  }
}

describe('core search helpers', () => {
  beforeAll(() => {
    globalWithFuse.Fuse = FakeFuse as unknown as FuseCtor;
  });

  afterAll(() => {
    if (originalFuse) {
      globalWithFuse.Fuse = originalFuse;
    } else {
      delete globalWithFuse.Fuse;
    }
  });

  test('getQueryInfo extracts searchable fields from wiki infos', () => {
    expect(
      getQueryInfo([
        {
          name: '标题',
          value: '测试条目',
          category: 'subject_title',
        },
        {
          name: '发售日期',
          value: '2024-01-02',
          category: 'date',
        },
        {
          name: 'ISBN',
          value: '978-1-23-456789-0',
          category: 'ISBN',
        },
      ])
    ).toEqual({
      name: '测试条目',
      releaseDate: '2024-01-02',
      isbn: '978-1-23-456789-0',
    });
  });

  test('filterResults returns the sole result directly during search', () => {
    const result: SearchResult = {
      name: '唯一条目',
      url: '/subject/1',
    };

    expect(
      filterResults([result], {
        name: '唯一条目',
      })
    ).toEqual(result);
  });

  test('filterResults prefers a result with a matching release date', () => {
    const items: SearchResult[] = [
      {
        name: '测试条目',
        url: '/subject/1',
        releaseDate: '2024-01-01',
      },
      {
        name: '测试条目',
        url: '/subject/2',
        releaseDate: '2024-02-02',
      },
    ];

    expect(
      filterResults(
        items,
        {
          name: '测试条目',
          releaseDate: '2024-02-02',
        },
        {
          keys: ['name', 'greyName'],
        }
      )
    ).toEqual(items[1]);
  });

  test('filterResults falls back to greyName matching when needed', () => {
    const items: SearchResult[] = [
      {
        name: 'Alpha',
        greyName: '测试条目',
        url: '/subject/3',
      },
    ];

    expect(
      filterResults(
        items,
        {
          name: '测试条目',
        },
        {
          keys: ['name', 'greyName'],
        },
        false
      )
    ).toEqual(items[0]);
  });
});

