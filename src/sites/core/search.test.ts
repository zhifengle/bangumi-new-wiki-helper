import { SearchResult } from '../../interface/subjectInfo';
import {
  filterResults,
  getQueryInfo,
  rankSearchResults,
} from './search';

describe('core search helpers', () => {
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

  test('filterResults does not accept an unrelated sole search result', () => {
    const result: SearchResult = {
      name: '完全无关的条目',
      url: '/subject/1',
    };

    expect(
      filterResults([result], {
        name: '待查条目',
      })
    ).toBeUndefined();
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
        { keys: ['name', 'greyName'] }
      )
    ).toEqual(items[0]);
  });

  test('treats regexp metacharacters as ordinary title characters', () => {
    const item = { name: '*Luna', url: '/subject/4' };

    expect(filterResults([item], { name: '*Luna' })).toEqual(item);
  });

  test('ranks exact normalized names before fuzzy candidates', () => {
    const exact = { name: 'Ｔｅｓｔ  Game', url: '/subject/5' };
    const fuzzy = { name: 'Test Games', url: '/subject/6' };

    expect(rankSearchResults([fuzzy, exact], 'test game')).toEqual([
      exact,
      fuzzy,
    ]);
  });
});

