/**
 * @jest-environment jsdom
 */
import { dmmSubject } from '../sites/dmm/subject';
import { getchuSubject } from '../sites/getchu/subject';
import { initSourceCharacter } from './character';
import { SourceRuntimeAdapter } from './runtime';

async function flushAsyncEvents() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('initSourceCharacter', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="genretab current"><a>ゲーム</a></div>
      <div id="wrapper">
        <div class="tabletitle">角色</div>
        <div class="character-section">
          <table>
            <tr>
              <td></td>
              <td class="chara-text">
                <dl>
                  <dt><h4 class="chara-name">新角色（しんきゃら） CV：测试声优</h4></dt>
                  <dd>
                    <span style="font-weight: bold;">身長：160cm</span>
                    开朗活泼的女主角
                  </dd>
                </dl>
              </td>
            </tr>
            <tr>
              <td></td>
              <td class="chara-text">
                <dl>
                  <dt><h2 class="chara-name">旧角色（ふるきゃら） CV：旧声优</h2></dt>
                  <dd>
                    沉着冷静的前辈
                  </dd>
                </dl>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;
    jest.clearAllMocks();
  });

  test('uses inline controls for getchu characters and submits parsed data', async () => {
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const runtime: SourceRuntimeAdapter = {
      fetchHtml: jest.fn().mockResolvedValue(''),
      hydrateSubjectCover: jest.fn().mockResolvedValue(undefined),
      hydrateCharacterCover: jest.fn().mockResolvedValue(undefined),
      submitSubjectCreation: jest.fn().mockResolvedValue(undefined),
      submitCharacterCreation: jest.fn().mockResolvedValue(undefined),
    };

    await initSourceCharacter(getchuSubject, runtime);
    expect(runtime.fetchHtml).not.toHaveBeenCalled();

    const buttons = document.querySelectorAll<HTMLElement>('.e-wiki-new-character');
    expect(buttons).toHaveLength(2);

    buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(runtime.hydrateCharacterCover).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: '姓名',
          value: '新角色',
          category: 'crt_name',
        }),
      ])
    );
    expect(runtime.submitCharacterCreation).toHaveBeenCalledWith({
      siteConfig: getchuSubject,
      charaData: expect.objectContaining({
        type: getchuSubject.type,
        infos: expect.arrayContaining([
          expect.objectContaining({
            name: '姓名',
            value: '新角色',
            category: 'crt_name',
          }),
          expect.objectContaining({
            name: 'CV',
            value: '测试声优',
          }),
          expect.objectContaining({
            name: '人物简介',
            value: '开朗活泼的女主角',
            category: 'crt_summary',
          }),
        ]),
      }),
    });

    infoSpy.mockRestore();
  });

  test('uses toolbarSelector as the select-mode character UI anchor', async () => {
    document.body.innerHTML = `
      <div class="ntgnav-mainItem is-active"><span>ゲーム</span></div>
      <h1 id="title">DMM Title</h1>
      <iframe id="if_view" src="https://example.com/chara"></iframe>
    `;
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const runtime: SourceRuntimeAdapter = {
      fetchHtml: jest.fn().mockResolvedValue(`
        <body>
          <div class="guide-sect">
            <div class="guide-box-chr">
              <div>
                <span class="guide-tx16 guide-bold guide-lin-hgt">Alice（ありす）</span>
                CV：测试声优
              </div>
              <div class="box">趣味：音乐</div>
            </div>
            <div class="guide-box-chr">
              <div>
                <span class="guide-tx16 guide-bold guide-lin-hgt">Bob（ぼぶ）</span>
                CV：第二声优
              </div>
              <div class="box">趣味：游戏</div>
            </div>
          </div>
        </body>
      `),
      hydrateSubjectCover: jest.fn().mockResolvedValue(undefined),
      hydrateCharacterCover: jest.fn().mockResolvedValue(undefined),
      submitSubjectCreation: jest.fn().mockResolvedValue(undefined),
      submitCharacterCreation: jest.fn().mockResolvedValue(undefined),
    };

    await initSourceCharacter(dmmSubject, runtime);

    const wrap = document.querySelector('.e-bnwh-add-chara-wrap');
    const select = wrap?.querySelector<HTMLSelectElement>('.e-bnwh-select');
    expect(wrap).not.toBeNull();
    expect(select?.options).toHaveLength(2);
    expect(Array.from(select?.options ?? []).map((option) => option.value)).toEqual([
      'Alice',
      'Bob',
    ]);

    wrap
      ?.querySelector<HTMLElement>('.e-wiki-new-character')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();

    expect(runtime.submitCharacterCreation).toHaveBeenCalledWith({
      siteConfig: dmmSubject,
      charaData: expect.objectContaining({
        type: dmmSubject.type,
        infos: expect.arrayContaining([
          expect.objectContaining({
            name: '姓名',
            value: 'Alice',
            category: 'crt_name',
          }),
        ]),
      }),
    });

    infoSpy.mockRestore();
  });
});
