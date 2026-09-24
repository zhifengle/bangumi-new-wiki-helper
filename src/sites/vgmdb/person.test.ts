// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { vi } from 'vitest';
import { SingleInfo } from '../../interface/subjectInfo';
import {
  createRemoteWikiPageContext,
  createWikiExtractContext,
} from '../core/context';
import { getPersonData } from '../core/extract';
import { vgmdbArtist } from './artist';
import { vgmdbOrg } from './org';

vi.mock('../../utils/dealImage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/dealImage')>();
  return {
    ...actual,
    getImageDataByURL: vi.fn().mockResolvedValue('data:image/png;base64,portrait'),
  };
});

function loadFixture(name: string) {
  // 路径先放进变量，避免 Vite 把字面量 URL 当静态资源改写
  const fixturePath = '../../data/' + name;
  const html = readFileSync(new URL(fixturePath, import.meta.url), 'utf8');
  return new DOMParser().parseFromString(html, 'text/html');
}

function byName(infos: SingleInfo[], name: string) {
  return infos.filter((info) => info.name === name);
}

function valuesOf(infos: SingleInfo[], name: string) {
  return byName(infos, name).map((info) => info.value);
}

describe('vgmdb artist person source', () => {
  test('extracts a Japanese composer page into Bangumi person infos', async () => {
    const doc = loadFixture('vgmdb-artist.html');
    const infos = await getPersonData(
      vgmdbArtist,
      createWikiExtractContext(
        doc,
        createRemoteWikiPageContext('https://vgmdb.net/artist/2')
      )
    );

    expect(byName(infos, '姓名')).toEqual([
      { name: '姓名', value: '折戸伸治', category: 'crt_name' },
    ]);
    expect(valuesOf(infos, '日文名')).toEqual(['折戸伸治']);
    expect(valuesOf(infos, '纯假名')).toEqual(['おりと しんじ']);
    expect(valuesOf(infos, '罗马字')).toEqual(['Orito Shinji']);
    expect(valuesOf(infos, '性别')).toEqual(['男']);
    expect(valuesOf(infos, '生日')).toEqual(['1973年7月30日']);
    expect(valuesOf(infos, '出生地')).toEqual(['Hyogo Prefecture, Japan']);
    expect(byName(infos, '别名')).toEqual([
      { name: '别名', value: 'Ganma', category: 'listItem' },
      { name: '别名', value: 'Ichirou', category: 'listItem' },
      { name: '别名', value: 'Ichirou Mimata', category: 'listItem' },
      { name: '别名', value: 'S.Orito', category: 'listItem' },
    ]);
    expect(byName(infos, '所属公司')).toEqual([
      { name: '所属公司', value: 'Unison LABEL', category: 'listItem' },
      { name: '所属公司', value: 'VISUAL ARTS Co., Ltd.', category: 'listItem' },
    ]);
    expect(byName(infos, '肖像')).toEqual([
      {
        name: '肖像',
        value: {
          url: 'https://media.vgm.io/artists/20/2/2-1467479875.png',
          dataUrl: 'data:image/png;base64,portrait',
        },
        category: 'crt_cover',
      },
    ]);
    // Notes placeholder, archived official links and the Reference group are all left out
    expect(byName(infos, '人物简介')).toEqual([]);
    expect(byName(infos, '官方网站')).toEqual([]);
    expect(byName(infos, '链接')).toEqual([]);
    expect(byName(infos, '血型')).toEqual([]);
    expect(byName(infos, '毕业院校')).toEqual([]);
    expect(infos.some((info) => info.category === 'select')).toBe(false);
  });

  test('extracts a page without a Japanese name and with full link groups', async () => {
    const doc = loadFixture('vgmdb-artist-zun.html');
    const infos = await getPersonData(
      vgmdbArtist,
      createWikiExtractContext(
        doc,
        createRemoteWikiPageContext('https://vgmdb.net/artist/1')
      )
    );

    expect(byName(infos, '姓名')).toEqual([
      { name: '姓名', value: 'ZUN', category: 'crt_name' },
    ]);
    expect(byName(infos, '日文名')).toEqual([]);
    expect(byName(infos, '罗马字')).toEqual([]);
    expect(valuesOf(infos, '生日')).toEqual(['1977年3月18日']);
    expect(valuesOf(infos, '血型')).toEqual(['A']);
    expect(valuesOf(infos, '出生地')).toEqual([
      'Hakuba, Kitaazumi District, Nagano Prefecture, Japan',
    ]);
    expect(valuesOf(infos, '毕业院校')).toEqual([
      'Mathematics, Tokyo Denki University',
    ]);
    expect(byName(infos, '别名')).toEqual([
      { name: '别名', value: 'zun', category: 'listItem' },
    ]);
    expect(valuesOf(infos, '所属公司')).toEqual(['Team Shanghai Alice']);
    expect(valuesOf(infos, '官方网站')).toEqual(['https://www16.big.or.jp/~zun/']);
    expect(byName(infos, '链接')).toEqual([
      {
        name: '链接',
        value: 'Touhou Yomoyama News (ZUN)|https://touhou-project.news/zun/',
        category: 'listItem',
      },
      {
        name: '链接',
        value:
          'YouTube|https://www.youtube.com/channel/UCRslviI58g0iRunL7z4LG7A',
        category: 'listItem',
      },
      {
        name: '链接',
        value: '博麗幻想書譜 (blog)|https://kourindou.exblog.jp/',
        category: 'listItem',
      },
      {
        name: '链接',
        value: 'Facebook|https://www.facebook.com/junya.ota.96',
        category: 'listItem',
      },
    ]);
    const summary = byName(infos, '人物简介');
    expect(summary).toHaveLength(1);
    expect(summary[0].category).toBe('crt_summary');
    expect(String(summary[0].value)).toMatch(/^Junya Ota/);
    expect(String(summary[0].value)).toMatch(/Touhou Project/);
  });
});

describe('vgmdb org person source', () => {
  test('extracts a label page into a company person draft', async () => {
    const doc = loadFixture('vgmdb-org.html');
    const infos = await getPersonData(
      vgmdbOrg,
      createWikiExtractContext(
        doc,
        createRemoteWikiPageContext('https://vgmdb.net/org/1')
      )
    );

    expect(byName(infos, '姓名')).toEqual([
      { name: '姓名', value: 'Key Sounds Label', category: 'crt_name' },
    ]);
    expect(byName(infos, 'crt_role')).toEqual([
      { name: 'crt_role', value: '2', category: 'select' },
    ]);
    const summary = byName(infos, '人物简介');
    expect(summary).toHaveLength(1);
    expect(summary[0].category).toBe('crt_summary');
    expect(String(summary[0].value)).toMatch(/^Music label of visual novel studio/);
    expect(valuesOf(infos, '官方网站')).toEqual(['https://key.soundslabel.com/']);
    expect(byName(infos, '链接')).toEqual([]);
    expect(byName(infos, '肖像')).toEqual([
      {
        name: '肖像',
        value: {
          url: 'https://media.vgm.io/orgs/10/1/1-1399279576.png',
          dataUrl: 'data:image/png;base64,portrait',
        },
        category: 'crt_cover',
      },
    ]);
    expect(byName(infos, 'Type')).toEqual([]);
    expect(byName(infos, 'Region')).toEqual([]);
  });
});
