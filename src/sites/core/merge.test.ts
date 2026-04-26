import { combineInfoList } from './merge';

// ─── 已有测试（保持不变）──────────────────────────────────────────────────────

describe('core merge helpers', () => {
  test('combineInfoList merges duplicate and multi-value fields', () => {
    const result = combineInfoList(
      [
        { name: 'website', value: '123' },
        { name: '别名', value: 'b1' },
        { name: '平台', value: 'PC' },
        { name: '平台', value: 'PC3' },
      ],
      [
        { name: '平台', value: 'PC' },
        { name: '别名', value: 'b2' },
        { name: '名称', value: 'test' },
      ]
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'website', value: '123' }),
        expect.objectContaining({ name: '别名', value: 'b1' }),
        expect.objectContaining({ name: '别名', value: 'b2' }),
        expect.objectContaining({ name: '平台', value: 'PC' }),
        expect.objectContaining({ name: '平台', value: 'PC3' }),
        expect.objectContaining({ name: '名称', value: 'test' }),
      ])
    );
    // 平台:PC 不能重复
    expect(result.filter((v) => v.name === '平台' && v.value === 'PC')).toHaveLength(1);
  });

  test('combineInfoList keeps title, chinese title and alias semantics', () => {
    // 中英
    const b = combineInfoList(
      [{ name: '游戏名', value: 'en', category: 'subject_title' }],
      [{ name: '游戏名', value: '中文', category: 'subject_title' }]
    );
    expect(b).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '游戏名', value: 'en', category: 'subject_title' }),
        expect.objectContaining({ name: '中文名', value: '中文' }),
      ])
    );

    // 日中
    const c = combineInfoList(
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' }],
      [{ name: '游戏名', value: '中文', category: 'subject_title' }]
    );
    expect(c).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' }),
        expect.objectContaining({ name: '中文名', value: '中文' }),
      ])
    );

    // 日英
    const d = combineInfoList(
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' }],
      [{ name: '游戏名', value: 'en', category: 'subject_title' }]
    );
    expect(d).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' }),
        expect.objectContaining({ name: '别名', value: 'en' }),
      ])
    );
  });

  test('combineInfoList avoids duplicate aliases and respects origin preferences', () => {
    // 别名 value 与主标题相同时应被过滤
    const e = combineInfoList(
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' }],
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'alias' }]
    );
    expect(e).toEqual([
      { name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' },
    ]);

    // originNames 指定字段保留 origin 侧
    const f = combineInfoList(
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' }],
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム' }],
      { originNames: ['游戏名'] }
    );
    expect(f).toEqual([
      { name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' },
    ]);
  });

  test('combineInfoList returns the non-empty side when one list is empty', () => {
    expect(combineInfoList([{ name: '游戏名', value: '蒼の彼方のフォーリズム' }], [])).toEqual([
      { name: '游戏名', value: '蒼の彼方のフォーリズム' },
    ]);
    expect(combineInfoList([], [{ name: '游戏名', value: '蒼の彼方のフォーリズム' }])).toEqual([
      { name: '游戏名', value: '蒼の彼方のフォーリズム' },
    ]);
  });
});

// ─── 新增测试 ────────────────────────────────────────────────────────────────

// Step 1：分组归并边界
describe('groupFields behavior', () => {
  test('field only in infoList is preserved as-is', () => {
    const result = combineInfoList(
      [{ name: '发售日', value: '2020-01-01' }],
      [{ name: '开发商', value: 'Studio A' }]
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '发售日', value: '2020-01-01' }),
        expect.objectContaining({ name: '开发商', value: 'Studio A' }),
      ])
    );
  });

  test('field only in otherInfoList is appended', () => {
    const result = combineInfoList(
      [{ name: '发售日', value: '2020-01-01' }],
      [{ name: '官网', value: 'https://example.com' }]
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '官网', value: 'https://example.com' }),
      ])
    );
  });

  test('targetNames field is taken from otherInfoList, origin side is dropped', () => {
    const result = combineInfoList(
      [{ name: '评分', value: '7' }],
      [{ name: '评分', value: '9' }],
      { targetNames: ['评分'] }
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '评分', value: '9' }),
      ])
    );
    expect(result.filter((v) => v.name === '评分')).toHaveLength(1);
  });

  test('originNames: all keeps every field from infoList', () => {
    const result = combineInfoList(
      [
        { name: '评分', value: '7' },
        { name: '发售日', value: '2020-01-01' },
        { name: '平台', value: 'PC' },
      ],
      [
        { name: '评分', value: '9' },
        { name: '发售日', value: '2021-06-01' },
        { name: '官网', value: 'https://example.com' },
      ],
      { originNames: 'all' }
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '评分', value: '7' }),
        expect.objectContaining({ name: '发售日', value: '2020-01-01' }),
        expect.objectContaining({ name: '平台', value: 'PC' }),
      ])
    );
    expect(result.find((v) => v.name === '评分')?.value).toBe('7');
    expect(result.find((v) => v.name === '官网')).toBeUndefined();
  });

  test('targetNames: all keeps every field from otherInfoList', () => {
    const result = combineInfoList(
      [
        { name: '评分', value: '7' },
        { name: '发售日', value: '2020-01-01' },
      ],
      [
        { name: '评分', value: '9' },
        { name: '官网', value: 'https://example.com' },
      ],
      { targetNames: 'all' }
    );
    expect(result.find((v) => v.name === '评分')?.value).toBe('9');
    expect(result.find((v) => v.name === '官网')?.value).toBe('https://example.com');
    expect(result.find((v) => v.name === '发售日')).toBeUndefined();
  });

  test('targetNames: all still respects originNames exceptions', () => {
    const result = combineInfoList(
      [
        { name: '平台', value: 'PC' },
        { name: '评分', value: '7' },
      ],
      [
        { name: '平台', value: 'Switch' },
        { name: '评分', value: '9' },
      ],
      {
        originNames: ['平台'],
        targetNames: 'all',
      }
    );
    expect(result.find((v) => v.name === '平台')?.value).toBe('PC');
    expect(result.find((v) => v.name === '评分')?.value).toBe('9');
  });
});

// Step 2：策略选择
describe('merge strategies', () => {
  test('longerValue strategy picks the longer string', () => {
    const result = combineInfoList(
      [{ name: '简介', value: 'short' }],
      [{ name: '简介', value: 'a much longer description' }]
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '简介', value: 'a much longer description' }),
      ])
    );
  });

  test('longerValue strategy keeps origin when it is longer', () => {
    const result = combineInfoList(
      [{ name: '简介', value: 'a much longer description' }],
      [{ name: '简介', value: 'short' }]
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '简介', value: 'a much longer description' }),
      ])
    );
  });

  test('longerValue strategy keeps either when lengths are equal', () => {
    const result = combineInfoList(
      [{ name: '简介', value: 'abcd' }],
      [{ name: '简介', value: 'efgh' }]
    );
    const item = result.find((v) => v.name === '简介');
    expect(['abcd', 'efgh']).toContain(item?.value);
  });

  test('keepOrigin strategy is applied to 游戏简介, 开发, 发行', () => {
    for (const name of ['游戏简介', '开发', '发行']) {
      const result = combineInfoList(
        [{ name, value: 'origin-value' }],
        [{ name, value: 'other-value' }]
      );
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name, value: 'origin-value' }),
        ])
      );
      expect(result.filter((v) => v.name === name)).toHaveLength(1);
    }
  });

  test('subject_title: two identical values produces no duplicate entries', () => {
    const result = combineInfoList(
      [{ name: '游戏名', value: 'SameTitle', category: 'subject_title' }],
      [{ name: '游戏名', value: 'SameTitle', category: 'subject_title' }]
    );
    // 主标题保留，cnName/别名为空被过滤，不应出现重复
    expect(result.filter((v) => v.value === 'SameTitle')).toHaveLength(1);
  });

  test('subject_title: jp from other side, cn from origin side', () => {
    const result = combineInfoList(
      [{ name: '游戏名', value: '中文名称', category: 'subject_title' }],
      [{ name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' }]
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '游戏名', value: '蒼の彼方のフォーリズム' }),
        expect.objectContaining({ name: '中文名', value: '中文名称' }),
      ])
    );
  });

  test('subject_title: two non-CJK values → longer one wins, no cnName/alias emitted', () => {
    const result = combineInfoList(
      [{ name: '游戏名', value: 'Short', category: 'subject_title' }],
      [{ name: '游戏名', value: 'LongerTitle', category: 'subject_title' }]
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '游戏名', value: 'LongerTitle' }),
      ])
    );
    expect(result.find((v) => v.name === '中文名')).toBeUndefined();
    expect(result.find((v) => v.name === '别名')).toBeUndefined();
  });
});

// Step 3：去重
describe('dedup behavior', () => {
  test('exact duplicate items (same name + value) appear only once', () => {
    const result = combineInfoList(
      [{ name: '发售日', value: '2020-01-01' }],
      [{ name: '发售日', value: '2020-01-01' }]
    );
    expect(result.filter((v) => v.name === '发售日')).toHaveLength(1);
  });

  test('alias whose value duplicates another field value is removed', () => {
    // subject_title 合并后，别名产生的值与主标题相同，应被去重
    const result = combineInfoList(
      [{ name: '游戏名', value: 'MyGame', category: 'subject_title' }],
      [{ name: '别名', value: 'MyGame' }]
    );
    expect(result.filter((v) => v.value === 'MyGame')).toHaveLength(1);
    expect(result.find((v) => v.name === '游戏名')?.value).toBe('MyGame');
    expect(result.find((v) => v.name === '别名')).toBeUndefined();
  });

  test('alias duplicate is removed even when alias appears before the main field', () => {
    const result = combineInfoList(
      [{ name: '别名', value: 'MyGame' }],
      [{ name: '游戏名', value: 'MyGame' }]
    );
    expect(result.filter((v) => v.value === 'MyGame')).toHaveLength(1);
    expect(result.find((v) => v.name === '游戏名')?.value).toBe('MyGame');
    expect(result.find((v) => v.name === '别名')).toBeUndefined();
  });

  test('two aliases with different values are both kept', () => {
    const result = combineInfoList(
      [{ name: '别名', value: 'AliasA' }],
      [{ name: '别名', value: 'AliasB' }]
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '别名', value: 'AliasA' }),
        expect.objectContaining({ name: '别名', value: 'AliasB' }),
      ])
    );
  });

  test('empty-value items are filtered out', () => {
    const result = combineInfoList(
      [{ name: '别名', value: '' }],
      [{ name: '游戏名', value: 'Title' }]
    );
    expect(result.find((v) => v.name === '别名')).toBeUndefined();
  });

  test('same 平台 from both sides appears only once', () => {
    const result = combineInfoList(
      [{ name: '平台', value: 'PS5' }],
      [{ name: '平台', value: 'PS5' }]
    );
    expect(result.filter((v) => v.name === '平台' && v.value === 'PS5')).toHaveLength(1);
  });
});

// ─── 集成场景 ─────────────────────────────────────────────────────────────────

describe('integration scenarios', () => {
  test('full game entry merge: jp title + cn title + platforms + alias', () => {
    const result = combineInfoList(
      [
        { name: '游戏名', value: '蒼の彼方のフォーリズム', category: 'subject_title' },
        { name: '平台', value: 'PC' },
        { name: '发售日', value: '2015-11-19' },
        { name: '开发', value: 'sprite' },
      ],
      [
        { name: '游戏名', value: '苍之彼方的四重奏', category: 'subject_title' },
        { name: '平台', value: 'PS4' },
        { name: '发售日', value: '2015-11-19 (PC)' },
        { name: '开发', value: 'sprite（日）' },
        { name: '官网', value: 'https://example.com' },
      ]
    );

    // 日文主标题
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '游戏名', value: '蒼の彼方のフォーリズム' }),
        expect.objectContaining({ name: '中文名', value: '苍之彼方的四重奏' }),
      ])
    );
    // 多值平台各自保留
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '平台', value: 'PC' }),
        expect.objectContaining({ name: '平台', value: 'PS4' }),
      ])
    );
    // 发售日取较长
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '发售日', value: '2015-11-19 (PC)' }),
      ])
    );
    // 开发字段保留 origin
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '开发', value: 'sprite' }),
      ])
    );
    expect(result.filter((v) => v.name === '开发')).toHaveLength(1);
    // 仅 other 有的字段被追加
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: '官网', value: 'https://example.com' }),
      ])
    );
  });

  test('targetNames takes precedence over originNames when both are specified for different fields', () => {
    const result = combineInfoList(
      [
        { name: '评分', value: '7' },
        { name: '发售日', value: '2020-01-01' },
      ],
      [
        { name: '评分', value: '9' },
        { name: '发售日', value: '2021-06-01' },
      ],
      {
        originNames: ['发售日'],
        targetNames: ['评分'],
      }
    );
    expect(result.find((v) => v.name === '评分')?.value).toBe('9');
    expect(result.find((v) => v.name === '发售日')?.value).toBe('2020-01-01');
  });

  test('null / undefined list inputs are handled gracefully', () => {
    expect(combineInfoList(null as any, [{ name: 'x', value: '1' }])).toEqual([
      { name: 'x', value: '1' },
    ]);
    expect(combineInfoList([{ name: 'x', value: '1' }], null as any)).toEqual([
      { name: 'x', value: '1' },
    ]);
    expect(combineInfoList(null as any, null as any)).toBeNull();
  });
});
