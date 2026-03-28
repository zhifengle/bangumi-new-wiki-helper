/**
 * @jest-environment jsdom
 */
import { getchuGameModel } from '../models/getchuGame';
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

    await initSourceCharacter(getchuGameModel, runtime);
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
      siteConfig: getchuGameModel,
      charaData: expect.objectContaining({
        type: getchuGameModel.type,
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
});
