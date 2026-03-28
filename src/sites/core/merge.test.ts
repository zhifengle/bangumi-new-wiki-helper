import { combineInfoList } from './merge';

describe('core merge helpers', () => {
  test('combineInfoList merges duplicate and multi-value fields', () => {
    const result = combineInfoList(
      [
        {
          name: 'website',
          value: '123',
        },
        {
          name: '别名',
          value: 'b1',
        },
        {
          name: '平台',
          value: 'PC',
        },
        {
          name: '平台',
          value: 'PC3',
        },
      ],
      [
        {
          name: '平台',
          value: 'PC',
        },
        {
          name: '别名',
          value: 'b2',
        },
        {
          name: '名称',
          value: 'test',
        },
      ]
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'website',
          value: '123',
        }),
        expect.objectContaining({
          name: '别名',
          value: 'b1',
        }),
        expect.objectContaining({
          name: '别名',
          value: 'b2',
        }),
        expect.objectContaining({
          name: '平台',
          value: 'PC',
        }),
        expect.objectContaining({
          name: '平台',
          value: 'PC3',
        }),
        expect.objectContaining({
          name: '名称',
          value: 'test',
        }),
      ])
    );
  });

  test('combineInfoList keeps title, chinese title and alias semantics', () => {
    const b = combineInfoList(
      [{ name: '游戏名', value: 'en', category: 'subject_title' }],
      [{ name: '游戏名', value: '中文', category: 'subject_title' }]
    );
    expect(b).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '游戏名',
          value: 'en',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: '中文名',
          value: '中文',
        }),
      ])
    );

    const c = combineInfoList(
      [
        {
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        },
      ],
      [{ name: '游戏名', value: '中文', category: 'subject_title' }]
    );
    expect(c).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: '中文名',
          value: '中文',
        }),
      ])
    );

    const d = combineInfoList(
      [
        {
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        },
      ],
      [{ name: '游戏名', value: 'en', category: 'subject_title' }]
    );
    expect(d).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        }),
        expect.objectContaining({
          name: '别名',
          value: 'en',
        }),
      ])
    );
  });

  test('combineInfoList avoids duplicate aliases and respects origin preferences', () => {
    const e = combineInfoList(
      [
        {
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        },
      ],
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'alias' }]
    );
    expect(e).toEqual([
      {
        name: '游戏名',
        value: '蒼の彼方のフォーリズム',
        category: 'subject_title',
      },
    ]);

    const f = combineInfoList(
      [
        {
          name: '游戏名',
          value: '蒼の彼方のフォーリズム',
          category: 'subject_title',
        },
      ],
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム' }],
      {
        originNames: ['游戏名'],
      }
    );
    expect(f).toEqual([
      {
        name: '游戏名',
        value: '蒼の彼方のフォーリズム',
        category: 'subject_title',
      },
    ]);
  });

  test('combineInfoList returns the non-empty side when one list is empty', () => {
    expect(
      combineInfoList([{ name: '游戏名', value: '蒼の彼方のフォーリズム' }], [])
    ).toEqual([{ name: '游戏名', value: '蒼の彼方のフォーリズム' }]);
    expect(
      combineInfoList([], [{ name: '游戏名', value: '蒼の彼方のフォーリズム' }])
    ).toEqual([{ name: '游戏名', value: '蒼の彼方のフォーリズム' }]);
  });
});
