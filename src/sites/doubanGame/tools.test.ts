/**
 * @jest-environment jsdom
 */
import { SingleInfo } from '../../interface/subjectInfo';
import { doubanGameTools } from './tools';

describe('douban game tools', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
  });

  test('return auxSite and normalize split platform fields', async () => {
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

    await expect(doubanGameTools.hooks?.beforeCreate?.()).resolves.toEqual({
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

    const result = (await doubanGameTools.hooks?.afterGetWikiData?.([
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
});

