/**
 * @jest-environment jsdom
 */
const mockGetImageDataByURL = jest.fn();

jest.mock('../utils/dealImage', () => ({
  getImageDataByURL: mockGetImageDataByURL,
}));

import { SingleInfo } from '../interface/subject';
import {
  doubanGameEditTools,
  doubanMusicTools,
  doubanTools,
} from './douban';

describe('douban site tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
  });

  test('douban game hooks return auxSite and normalize split platform fields', async () => {
    window.history.replaceState({}, '', '/game/123');
    document.body.innerHTML = `
      <div class="th-modify">
        <a href="https://www.douban.com/game/123/edit">edit</a>
      </div>
      <div id="content">
        <dl class="game-attr">
          <dt>平台</dt>
          <dd>
            <a>Windows / Steam</a>
            <a>Switch / eShop</a>
          </dd>
        </dl>
      </div>
    `;

    await expect(doubanTools.hooks?.beforeCreate?.()).resolves.toEqual({
      payload: {
        auxSite: {
          url: 'https://www.douban.com/game/123/edit',
          prefs: {
            originNames: ['平台', '发行日期'],
            targetNames: 'all',
          },
        },
      },
    });

    const result = (await doubanTools.hooks?.afterGetWikiData?.([
      {
        name: '平台',
        value: 'PC / Switch',
      },
      {
        name: '别名',
        value: 'Alpha / Beta',
      },
      {
        name: '游戏类型',
        value: '游戏 / RPG',
      },
      {
        name: '封面',
        value: {
          url: 'https://img.example.com/cover.jpg',
        },
        category: 'cover',
      },
    ])) as SingleInfo[];

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '平台',
          value: 'PC',
        }),
        expect.objectContaining({
          name: '平台',
          value: 'Switch',
        }),
        expect.objectContaining({
          name: '别名',
          value: 'Alpha',
        }),
        expect.objectContaining({
          name: '别名',
          value: 'Beta',
        }),
        expect.objectContaining({
          name: '游戏类型',
          value: 'RPG',
        }),
        expect.objectContaining({
          name: '平台',
          value: 'Windows',
          category: 'platform',
        }),
        expect.objectContaining({
          name: '平台',
          value: 'Switch',
          category: 'platform',
        }),
      ])
    );
  });

  test('douban edit hooks map platform aliases, upgrade cover url and append description', async () => {
    window.history.replaceState({}, '', '/game/123/edit');
    document.body.innerHTML = `
      <form>
        <input name="target" type="hidden" value="description" />
        <div class="desc-form-item">
          <input id="thing_desc_options_0" value="编辑简介" />
        </div>
      </form>
    `;
    mockGetImageDataByURL.mockResolvedValue('data:image/jpeg;base64,cover');

    const result = (await doubanGameEditTools.hooks?.afterGetWikiData?.([
      {
        name: '平台',
        value: 'ARC, 红白机',
      },
      {
        name: '游戏类型',
        value: '动作,角色扮演',
      },
      {
        name: '开发',
        value: 'Team A,Team B',
      },
      {
        name: 'cover',
        value: {
          url: 'https://img.example.com/spic/public/cover.jpg',
        },
        category: 'cover',
      },
    ])) as SingleInfo[];

    expect(mockGetImageDataByURL).toHaveBeenCalledWith(
      'https://img.example.com/lpic/public/cover.jpg'
    );
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '平台',
          value: 'Arcade',
        }),
        expect.objectContaining({
          name: '平台',
          value: 'FC',
        }),
        expect.objectContaining({
          name: '游戏类型',
          value: '动作, 角色扮演',
        }),
        expect.objectContaining({
          name: '开发',
          value: 'Team A, Team B',
        }),
        expect.objectContaining({
          name: '游戏简介',
          value: '编辑简介',
          category: 'subject_summary',
        }),
        expect.objectContaining({
          name: 'cover',
          value: {
            dataUrl: 'data:image/jpeg;base64,cover',
            url: 'https://img.example.com/lpic/public/cover.jpg',
          },
        }),
      ])
    );
  });

  test('douban music hooks parse metadata and build disc track groups', async () => {
    document.body.innerHTML = `
      <div id="info">
        <span class="pl">又名:</span>别名A
        <span class="pl">唱片数:</span>2
        <span class="pl">表演者:<a>艺术家甲</a><a>艺术家乙</a></span>
      </div>
      <div class="track-list">
        <ul class="track-items">
          <li data-track-order="1">Song 1 03:11</li>
          <li data-track-order="2">Song 2</li>
          <li data-track-order="0">Disc 2</li>
          <li data-track-order="1">Song 3 04:05</li>
        </ul>
      </div>
    `;

    const result = ((await doubanMusicTools.hooks?.afterGetWikiData?.([
      {
        name: '音乐简介',
        value: '已有简介',
        category: 'subject_summary',
      },
      ])) ?? []) as SingleInfo[];

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '别名',
          value: '别名A',
          category: 'alias',
        }),
        expect.objectContaining({
          name: '碟片数量',
          value: '2',
        }),
        expect.objectContaining({
          name: '艺术家',
          value: '艺术家甲、艺术家乙',
        }),
      ])
    );

    const epInfo = result.find((item) => item.category === 'ep');
    expect(epInfo?.value).toHaveLength(2);
    expect(epInfo?.value[0][0]).toEqual(
      expect.objectContaining({
        title: 'Song 1',
        duration: '03:11',
      })
    );
    expect(epInfo?.value[1][0]).toEqual(
      expect.objectContaining({
        title: 'Song 3',
        duration: '04:05',
      })
    );
  });
});
