import { SingleInfo } from "../../../interface/subjectInfo";
import { convertInfoValue } from "./mapper";

// ─── Mock 数据 ────────────────────────────────────────────────────────────────

const baseBookInfos: SingleInfo[] = [
  { name: '作者', value: '宮尾 岳', category: '' },
  { name: '出版社', value: '少年画報社', category: '' },
  { name: '发售日', value: '2019-02-16', category: 'date' },
  { name: '页数', value: '162', category: '' },
  { name: '名称', value: 'test', category: '' },
  { name: '内容简介', value: 'test summary', category: '' },
  { name: 'ISBN', value: '978-4785963811', category: 'ISBN' },
];

// ─── 测试套件 ─────────────────────────────────────────────────────────────────

describe('convertInfoValue', () => {
  // ── 原始用例 ──────────────────────────────────────────────────────────────

  it('test convert info', () => {
    const rawInfo = `
{{Infobox animanga/Manga
|中文名=
|出版社= *
|价格=
|作画=
|其他出版社=
|连载杂志=
|发售日=
|页数=
|话数=
|其他=
}}
    `;
    const infoArr = [...baseBookInfos];
    expect(convertInfoValue(rawInfo, infoArr)).toEqual(`{{Infobox animanga/Manga
|中文名=
|作者=宮尾 岳
|出版社=少年画報社
|价格=
|作画=
|其他出版社=
|连载杂志=
|发售日=2019-02-16
|页数=162
|话数=
|其他=
|名称=test
|内容简介=test summary
|ISBN=978-4785963811
}}`);
  });

  // ── 作者/出版社排序 ───────────────────────────────────────────────────────

  it('作者已在出版社之前时，不应改变顺序', () => {
    const rawInfo = `{{Infobox animanga/Manga
|中文名=
|作者=
|出版社=
|发售日=
}}`;
    const infoArr: SingleInfo[] = [
      { name: '作者', value: '作者A', category: '' },
      { name: '出版社', value: '出版社B', category: '' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    const lines = result.split('\n');
    const authorIdx = lines.findIndex((l) => l.includes('作者'));
    const pressIdx = lines.findIndex((l) => l.includes('出版社'));
    expect(authorIdx).toBeLessThan(pressIdx);
  });

  it('作者在出版社之后时，应将作者移至出版社之前', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
|出版社=
|作者=
|发售日=
}}`;
    const infoArr: SingleInfo[] = [
      { name: '出版社', value: '集英社', category: '' },
      { name: '作者', value: '尾田栄一郎', category: '' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    const lines = result.split('\n');
    const authorIdx = lines.findIndex((l) => /作者/.test(l));
    const pressIdx = lines.findIndex((l) => /出版社/.test(l));
    expect(authorIdx).toBeLessThan(pressIdx);
  });

  // ── ISBN 格式处理 ─────────────────────────────────────────────────────────

  it('ISBN 中的短横线应被去除', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
|ISBN=
}}`;
    const infoArr: SingleInfo[] = [
      { name: 'ISBN', value: '978-4-08-880024-5', category: 'ISBN' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).toContain('|ISBN=9784088800245');
    expect(result).not.toContain('-');
  });

  it('ISBN 已无短横线时应原样输出', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
|ISBN=
}}`;
    const infoArr: SingleInfo[] = [
      { name: 'ISBN', value: '9784088800245', category: 'ISBN' },
    ];
    expect(convertInfoValue(rawInfo, infoArr)).toContain('|ISBN=9784088800245');
  });

  // ── 日期格式处理 ──────────────────────────────────────────────────────────

  it('发售日应经过 dealDate 格式化', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
|发售日=
}}`;
    const infoArr: SingleInfo[] = [
      { name: '发售日', value: '2024/3/5', category: 'date' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    // dealDate 应将 2024/3/5 → 2024-03-05
    expect(result).toContain('|发售日=2024-03-05');
  });

  // ── 块格式字段 ────────────────────────────────────────────────────────────

  it('别名字段应保持 { } 块格式', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
|别名= {

}
|出版社=
}}`;
    const infoArr: SingleInfo[] = [
      { name: '别名', value: '異名', category: 'listItem' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).toMatch(/\|别名=\{/);
    expect(result).toContain('[異名]');
  });

  it('链接字段应保持 { } 块格式', () => {
    const rawInfo = `{{Infobox Game
|中文名=
|链接= {

}
}}`;
    const infoArr: SingleInfo[] = [
      { name: '链接', value: 'https://example.com', category: 'listItem' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).toMatch(/\|链接=\{/);
    expect(result).toContain('[https://example.com]');
  });

  it('website 有多个值时应转为块格式', () => {
    const rawInfo = `{{Infobox Game
|中文名=
|website=
}}`;
    const infoArr: SingleInfo[] = [
      { name: 'website', value: 'https://a.com', category: '' },
      { name: 'website', value: 'https://b.com', category: '' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).toMatch(/\|website=\{/);
  });

  it('website 只有一个值时不应转为块格式', () => {
    const rawInfo = `{{Infobox Game
|中文名=
|website=
}}`;
    const infoArr: SingleInfo[] = [
      { name: 'website', value: 'https://a.com', category: '' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).not.toMatch(/\|website=\{/);
    expect(result).toContain('|website=https://a.com');
  });

  // ── 未匹配字段追加 ────────────────────────────────────────────────────────

  it('infoArr 中模板没有的字段应追加到 }} 之前', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
}}`;
    const infoArr: SingleInfo[] = [
      { name: '中文名', value: '测试书名', category: '' },
      { name: '内容简介', value: '这是简介', category: '' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    const lines = result.split('\n');
    const summaryIdx = lines.findIndex((l) => l.includes('内容简介'));
    const closingIdx = lines.findIndex((l) => l.trim() === '}}');
    expect(summaryIdx).toBeGreaterThan(-1);
    expect(summaryIdx).toBeLessThan(closingIdx);
  });

  it('asin / ASIN 字段不应被追加', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
}}`;
    const infoArr: SingleInfo[] = [
      { name: 'asin', value: 'B08XYZ', category: '' },
      { name: 'ASIN', value: 'B08ABC', category: '' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).not.toContain('asin');
    expect(result).not.toContain('ASIN');
  });

  // ── [英文名|] 格式 ────────────────────────────────────────────────────────

  it('[英文名|] 格式应正确填入值', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
[英文名|]
}}`;
    const infoArr: SingleInfo[] = [
      { name: '英文名', value: 'Test Title', category: '' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).toContain('[英文名|Test Title]');
  });

  // ── 输出结构完整性 ────────────────────────────────────────────────────────

  it('输出应以 }} 结尾', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
}}`;
    const infoArr: SingleInfo[] = [
      { name: '中文名', value: '书名', category: '' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result.trimEnd()).toMatch(/}}$/);
  });

  it('infoArr 为空时应原样返回模板骨架', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
|出版社=
}}`;
    const result = convertInfoValue(rawInfo, []);
    expect(result).toContain('{{Infobox animanga/Book');
    expect(result).toContain('|中文名=');
    expect(result.trimEnd()).toMatch(/}}$/);
  });

  it('没有对应 info 时不应主动改写块字段', () => {
    const rawInfo = `{{Infobox Game
|中文名=
|平台=
}}`;
    const result = convertInfoValue(rawInfo, []);
    expect(result).toContain('|平台=');
    expect(result).not.toContain('|平台={');
  });

  // ── Album 模板 ────────────────────────────────────────────────────────────

  it('Album 模板：别名块格式不被重复写入', () => {
    const rawInfo = `{{Infobox Album
|中文名=
|别名={
}
|发售日期=
}}`;
    const infoArr: SingleInfo[] = [
      { name: '别名', value: '副标题', category: 'listItem' },
      { name: '发售日期', value: '2023-05-01', category: 'date' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    // 不应出现两个 |别名={
    const matches = result.match(/\|别名=\{/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('Album 模板：兼容字段值后的空格和已有块字段', () => {
    const rawInfo = `{{Infobox Album
|中文名= 
|别名={
}
|艺术家= 
|作曲= 
|编曲= 
|作词= 
|厂牌= 
|发售日期= 
|价格= 
|版本特性= 
|播放时长= 
|录音= 
|碟片数量= 
|链接={
}
}}`;
    const infoArr: SingleInfo[] = [
      { name: '中文名', value: '测试专辑', category: '' },
      { name: '别名', value: 'Album Alias', category: 'listItem' },
      { name: '艺术家', value: 'Artist A', category: '' },
      { name: '发售日期', value: '2024/3/5', category: 'date' },
      { name: '链接', value: 'https://example.com/album', category: 'listItem' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).toContain('|中文名=测试专辑');
    expect(result).toContain('|艺术家=Artist A');
    expect(result).toContain('|发售日期=2024-03-05');
    expect(result).toContain('|别名={\n[Album Alias]\n}');
    expect(result).toContain('|链接={\n[https://example.com/album]\n}');
  });

  // ── Game 模板 ─────────────────────────────────────────────────────────────

  it('Book 模板：兼容带空格的块字段', () => {
    const rawInfo = `{{Infobox animanga/Book
|中文名=
|别名= {

}
|作者=
|插图=
|出版社=
|价格=
|其他出版社=
|连载杂志=
|发售日=
|页数=
|ISBN=
|链接= {

}
|其他=
}}`;
    const infoArr: SingleInfo[] = [
      { name: '中文名', value: '测试书', category: '' },
      { name: '别名', value: 'Book Alias', category: 'listItem' },
      { name: '作者', value: '作者A', category: '' },
      { name: '出版社', value: '出版社B', category: '' },
      { name: '发售日', value: '2024/3/5', category: 'date' },
      { name: 'ISBN', value: '978-4-08-880024-5', category: 'ISBN' },
      { name: '链接', value: 'https://example.com/book', category: 'listItem' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).toContain('|中文名=测试书');
    expect(result).toContain('|别名={\n[Book Alias]\n}');
    expect(result).toContain('|链接={\n[https://example.com/book]\n}');
    expect(result).toContain('|发售日=2024-03-05');
    expect(result).toContain('|ISBN=9784088800245');
    expect(result.indexOf('|作者=作者A')).toBeLessThan(
      result.indexOf('|出版社=出版社B')
    );
  });

  it('Game 模板：平台字段应保持块格式', () => {
    const rawInfo = `{{Infobox Game
|中文名=
|平台={
}
|发行日期=
}}`;
    const infoArr: SingleInfo[] = [
      { name: '平台', value: 'PC', category: 'listItem' },
      { name: '发行日期', value: '2024-01-01', category: 'date' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).toMatch(/\|平台=\{/);
    expect(result).toContain('[PC]');
    const matches = result.match(/\|平台=\{/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('Game 模板：兼容空格、多值平台和单值 website', () => {
    const rawInfo = `{{Infobox Game
|中文名= 
|别名={
}
|平台={
}
|游戏类型= 
|游戏引擎= 
|游玩人数= 
|发行日期= 
|售价= 
|开发= 
|发行= 
|剧本= 
|程序= 
|website= 
|链接={
}
}}`;
    const infoArr: SingleInfo[] = [
      { name: '中文名', value: '测试游戏', category: '' },
      { name: '别名', value: 'Game Alias', category: 'listItem' },
      { name: '平台', value: 'PC', category: 'platform' },
      { name: '平台', value: 'PS5', category: 'platform' },
      { name: '发行日期', value: '2024/3/5', category: 'date' },
      { name: '开发', value: 'Dev A', category: '' },
      { name: 'website', value: 'https://example.com/game', category: '' },
      { name: '链接', value: 'https://store.example.com/game', category: 'listItem' },
    ];
    const result = convertInfoValue(rawInfo, infoArr);
    expect(result).toContain('|中文名=测试游戏');
    expect(result).toContain('|别名={\n[Game Alias]\n}');
    expect(result).toContain('|平台={\n[PC]\n[PS5]\n}');
    expect(result).toContain('|发行日期=2024-03-05');
    expect(result).toContain('|开发=Dev A');
    expect(result).toContain('|website=https://example.com/game');
    expect(result).toContain('|链接={\n[https://store.example.com/game]\n}');
  });
});
