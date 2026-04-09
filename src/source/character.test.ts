// @vitest-environment jsdom
import { vi } from 'vitest';
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
    vi.clearAllMocks();
  });

  test('uses inline controls for getchu characters and submits parsed data', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const runtime: SourceRuntimeAdapter = {
      fetchHtml: vi.fn().mockResolvedValue(''),
      hydrateSubjectCover: vi.fn().mockResolvedValue(undefined),
      hydrateCharacterCover: vi.fn().mockResolvedValue(undefined),
      submitSubjectCreation: vi.fn().mockResolvedValue(undefined),
      submitCharacterCreation: vi.fn().mockResolvedValue(undefined),
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

  test('extracts characters from the current DMM detail page without iframe', async () => {
    document.body.innerHTML = `
      <div class="productTitle">
        <h1 class="productTitle__item productTitle__item--headline">DMM Title</h1>
      </div>
      <div id="detailGuide" class="detailGuide">
        <div class="detailGuide__content">
          <p class="detailGuide__capt">キャラクター</p>
          <div class="detailGuide__sect">
            <div class="detailGuide__box-chr">
              <img src="https://example.com/alice.jpg" alt="Alice" />
              <div class="detailGuide__box-date">
                <p>
                  <span class="detailGuide__bold detailGuide__color02">
                    明朗快活なバイト学生
                  </span>
                  <br>
                  <span class="detailGuide__tx16 detailGuide__bold detailGuide__lin-hgt">
                    Alice（ありす）
                  </span>
                  &emsp;CV：测试声优
                </p>
                <p>第一段简介<br>第二段简介</p>
                <p class="detailGuide__tx14 detailGuide__bold">「角色台词」</p>
              </div>
            </div>
            <div class="detailGuide__box-chr">
              <img src="https://example.com/bob.jpg" alt="Bob" />
              <div class="detailGuide__box-date">
                <p>
                  <span class="detailGuide__bold detailGuide__color02">
                    社会の荒波に揉まれた悲しき青年
                  </span>
                  <br>
                  <span class="detailGuide__tx16 detailGuide__bold detailGuide__lin-hgt">
                    Bob（ぼぶ）※名前変更あり。
                  </span>
                </p>
                <p>第三段简介<br>第四段简介</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    for (const $p of Array.from(document.querySelectorAll<HTMLElement>('.detailGuide__box-date p'))) {
      Object.defineProperty($p, 'innerText', {
        configurable: true,
        value: ($p.textContent || '').replace(/\s+/g, ' ').trim(),
      });
    }
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const runtime: SourceRuntimeAdapter = {
      fetchHtml: vi.fn().mockResolvedValue(''),
      hydrateSubjectCover: vi.fn().mockResolvedValue(undefined),
      hydrateCharacterCover: vi.fn().mockResolvedValue(undefined),
      submitSubjectCreation: vi.fn().mockResolvedValue(undefined),
      submitCharacterCreation: vi.fn().mockResolvedValue(undefined),
    };

    await initSourceCharacter(dmmSubject, runtime);

    expect(runtime.fetchHtml).not.toHaveBeenCalled();

    const wrap = document.querySelector('.e-bnwh-add-chara-wrap');
    const select = wrap?.querySelector<HTMLSelectElement>('.e-bnwh-select');
    const characterHeader = document.querySelector('.detailGuide__capt');
    expect(wrap).not.toBeNull();
    expect(wrap?.previousElementSibling).toBe(characterHeader);
    expect(Array.from(select?.options ?? []).map((option) => option.value)).toEqual([
      'Alice',
      'Bob',
    ]);

    wrap
      ?.querySelector<HTMLElement>('.e-wiki-new-character')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncEvents();
    await vi.waitFor(() => {
      expect(runtime.submitCharacterCreation).toHaveBeenCalledTimes(1);
    });

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
          expect.objectContaining({
            name: '纯假名',
            value: 'ありす',
          }),
          expect.objectContaining({
            name: 'CV',
            value: '测试声优',
          }),
          expect.objectContaining({
            name: '人物简介',
            value: expect.stringContaining('第一段简介'),
            category: 'crt_summary',
          }),
        ]),
      }),
    });

    infoSpy.mockRestore();
  });
});
