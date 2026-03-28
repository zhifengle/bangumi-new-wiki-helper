/**
 * @jest-environment jsdom
 */
const mockInsertFillFormBtn = jest.fn();
const mockInitImageWidget = jest.fn();
const mockInitSubjectSubmit = jest.fn();
const mockInitCharacterSubmit = jest.fn();
const mockConvertInfoValue = jest.fn();
const mockSleep = jest.fn().mockResolvedValue(undefined);

jest.mock('./newSubject/controls', () => ({
  insertFillFormBtn: mockInsertFillFormBtn,
}));

jest.mock('./imageWidget', () => ({
  initImageWidget: mockInitImageWidget,
}));

jest.mock('./newSubject/submit', () => ({
  initSubjectSubmit: mockInitSubjectSubmit,
  initCharacterSubmit: mockInitCharacterSubmit,
}));

jest.mock('./newSubject/mapper', () => ({
  convertInfoValue: mockConvertInfoValue,
}));

jest.mock('../../utils/async/sleep', () => ({
  sleep: mockSleep,
}));

import { SubjectTypeId } from '../../interface/wiki';
import { fillInfoBox, initNewCharacter, initNewSubject } from './newSubject';

function renderSubjectDom() {
  document.body.innerHTML = `
    <table>
      <tr></tr>
      <tr>
        <td></td>
        <td>
          <input name="subtype-0" type="radio" />
          <input name="subtype-1" type="radio" />
          <input name="subtype-2" type="radio" />
        </td>
      </tr>
    </table>
    <table>
      <tr>
        <td>
          <small>
            <a href="javascript:void(0)">wiki</a>
            <a href="javascript:void(0)">newbie</a>
          </small>
        </td>
      </tr>
    </table>
    <form name="create_subject">
      <div class="title-parent">
        <input name="subject_title" />
      </div>
    </form>
    <div id="columnInSubjectA">
      <input name="subject_title" value="旧标题" />
      <input id="crt_name" value="旧角色名" />
    </div>
    <textarea id="subject_infobox">{{Infobox}}</textarea>
    <input id="subject_summary" value="" />
    <input id="crt_summary" value="" />
    <input id="crt_name" value="" />
    <input id="editSummary" value="" />
    <input name="subject_nsfw" type="checkbox" />
    <input name="platform" type="checkbox" checked />
    <div class="e-wiki-cover-container">
      <input class="clear-btn" type="button" value="clear" />
      <input name="submit" type="button" value="old" />
    </div>
    <form name="new_character">
      <div class="character-parent">
        <input id="crt_name" />
      </div>
    </form>
    <form name="img_upload"></form>
  `;
}

function createWikiInfo() {
  return {
    type: SubjectTypeId.game,
    subtype: 1,
    infos: [
      {
        name: '游戏名',
        value: '测试条目',
        category: 'subject_title',
      },
      {
        name: '简介',
        value: '条目简介',
        category: 'subject_summary',
      },
      {
        name: 'subject_nsfw',
        value: true,
        category: 'checkbox',
      },
      {
        name: '誕生日',
        value: '2000-01-01',
      },
      {
        name: '封面',
        value: {
          dataUrl: 'data:image/png;base64,cover',
        },
        category: 'cover',
      },
    ],
  };
}

function createCharacterInfo() {
  return {
    type: SubjectTypeId.game,
    infos: [
      {
        name: '角色名',
        value: 'Alice',
        category: 'crt_name',
      },
      {
        name: '角色简介',
        value: '角色简介',
        category: 'crt_summary',
      },
      {
        name: '肖像',
        value: {
          dataUrl: 'data:image/png;base64,chara',
        },
        category: 'crt_cover',
      },
    ],
  };
}

function getCapturedHandlers(callIndex = 0) {
  const [, fillHandler, cancelHandler] = mockInsertFillFormBtn.mock.calls[callIndex];
  return { fillHandler, cancelHandler };
}

describe('newSubject Batch C', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    renderSubjectDom();
    mockConvertInfoValue.mockReturnValue('converted-infobox');
  });

  test('fillInfoBox populates fields and converts infobox data with mapped names', async () => {
    const typeInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        'table tr:nth-of-type(2) > td:nth-of-type(2) input'
      )
    );
    const firstClickSpy = jest.spyOn(typeInputs[0], 'click');
    const secondClickSpy = jest.spyOn(typeInputs[1], 'click');

    await fillInfoBox(createWikiInfo());

    expect(firstClickSpy).toHaveBeenCalled();
    expect(secondClickSpy).toHaveBeenCalled();
    expect(
      document.querySelector<HTMLInputElement>('input[name=subject_title]')?.value
    ).toBe('测试条目');
    expect(
      document.querySelector<HTMLInputElement>('#subject_summary')?.value
    ).toBe('条目简介');
    expect(
      document.querySelector<HTMLInputElement>('input[name=subject_nsfw]')?.checked
    ).toBe(true);
    expect(mockConvertInfoValue).toHaveBeenCalledWith(
      '{{Infobox}}',
      expect.arrayContaining([
        expect.objectContaining({
          name: '生日',
          value: '2000-01-01',
        }),
      ])
    );
    expect(
      document.querySelector<HTMLTextAreaElement>('#subject_infobox')?.value
    ).toBe('converted-infobox');
  });

  test('subject cancel handler resets form state and dispatches clear event', () => {
    const clearButton = document.querySelector<HTMLInputElement>(
      '.e-wiki-cover-container .clear-btn'
    )!;
    const clearClickSpy = jest.spyOn(clearButton, 'click');
    const wikiMode = document.querySelector<HTMLElement>(
      'table small a[href="javascript:void(0)"]'
    )!;
    const wikiClickSpy = jest.spyOn(wikiMode, 'click');
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    initNewSubject(createWikiInfo());
    const { cancelHandler } = getCapturedHandlers(0);

    document.querySelector<HTMLInputElement>('input[name=platform]')!.checked = true;
    document.querySelector<HTMLTextAreaElement>('#subject_infobox')!.value =
      'modified';
    document.querySelector<HTMLInputElement>(
      '#columnInSubjectA [name=subject_title]'
    )!.value = 'modified';
    document.querySelector<HTMLInputElement>('#subject_summary')!.value = 'modified';
    document.querySelector<HTMLInputElement>('#editSummary')!.value = 'modified';
    document.querySelector<HTMLInputElement>(
      '.e-wiki-cover-container [name=submit]'
    )!.value = 'other';

    cancelHandler(new MouseEvent('click'));

    expect(document.querySelector<HTMLInputElement>('input[name=platform]')?.checked).toBe(
      false
    );
    expect(wikiClickSpy).toHaveBeenCalled();
    expect(
      document.querySelector<HTMLTextAreaElement>('#subject_infobox')?.value
    ).toBe('{{Infobox}}');
    expect(
      document.querySelector<HTMLInputElement>('#columnInSubjectA [name=subject_title]')
        ?.value
    ).toBe('');
    expect(document.querySelector<HTMLInputElement>('#subject_summary')?.value).toBe(
      ''
    );
    expect(document.querySelector<HTMLInputElement>('#editSummary')?.value).toBe('');
    expect(clearClickSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'scriptMessage',
      })
    );
    expect(
      document.querySelector<HTMLInputElement>('.e-wiki-cover-container [name=submit]')
        ?.value
    ).toBe('添加条目并上传封面');
    expect(mockInitImageWidget).toHaveBeenCalled();
    expect(mockInitSubjectSubmit).toHaveBeenCalled();
  });

  test('character cancel handler restores character form defaults', () => {
    const wikiMode = document.querySelector<HTMLElement>(
      'table small a[href="javascript:void(0)"]'
    )!;
    const wikiClickSpy = jest.spyOn(wikiMode, 'click');

    const characterInfo = createCharacterInfo();
    initNewCharacter(characterInfo, 123);
    const { cancelHandler } = getCapturedHandlers(0);

    document.querySelector<HTMLTextAreaElement>('#subject_infobox')!.value =
      'modified';
    document.querySelector<HTMLInputElement>('#columnInSubjectA #crt_name')!.value =
      'modified';
    document.querySelector<HTMLInputElement>('#crt_summary')!.value = 'modified';

    cancelHandler(new MouseEvent('click'));

    expect(wikiClickSpy).toHaveBeenCalled();
    expect(
      document.querySelector<HTMLTextAreaElement>('#subject_infobox')?.value
    ).toBe('{{Infobox}}');
    expect(document.querySelector<HTMLInputElement>('#columnInSubjectA #crt_name')?.value).toBe(
      ''
    );
    expect(document.querySelector<HTMLInputElement>('#crt_summary')?.value).toBe('');
    expect(document.querySelector('.e-wiki-cover-container')).toBeNull();
    expect(mockInitCharacterSubmit).toHaveBeenCalledWith(
      characterInfo,
      'data:image/png;base64,chara'
    );
  });
});
