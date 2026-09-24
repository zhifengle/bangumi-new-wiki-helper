// @vitest-environment jsdom
import { vi } from 'vitest';

const {
  mockInsertFillFormBtn,
  mockInitImageWidget,
  mockInitSubjectSubmit,
  mockInitCharacterSubmit,
  mockInitPersonSubmit,
  mockConvertInfoValue,
  mockSleep,
} = vi.hoisted(() => ({
  mockInsertFillFormBtn: vi.fn(),
  mockInitImageWidget: vi.fn(),
  mockInitSubjectSubmit: vi.fn(),
  mockInitCharacterSubmit: vi.fn(),
  mockInitPersonSubmit: vi.fn(),
  mockConvertInfoValue: vi.fn(),
  mockSleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./newSubject/controls', () => ({
  insertFillFormBtn: mockInsertFillFormBtn,
}));

vi.mock('./imageWidget', () => ({
  initImageWidget: mockInitImageWidget,
}));

vi.mock('./newSubject/submit', () => ({
  initSubjectSubmit: mockInitSubjectSubmit,
  initCharacterSubmit: mockInitCharacterSubmit,
  initPersonSubmit: mockInitPersonSubmit,
}));

vi.mock('./newSubject/mapper', () => ({
  convertInfoValue: mockConvertInfoValue,
}));

vi.mock('../../utils/async/sleep', () => ({
  sleep: mockSleep,
}));

import { SubjectTypeId } from '../../interface/wiki';
import {
  fillInfoBox,
  initNewCharacter,
  initNewPerson,
  initNewSubject,
} from './newSubject';

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
    <input name="prsn_pro[artist]" type="checkbox" />
    <select name="crt_role">
      <option value="1">个人</option>
      <option value="2">公司</option>
    </select>
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

function createPersonInfo() {
  return {
    infos: [
      {
        name: '姓名',
        value: '折戸伸治',
        category: 'crt_name',
      },
      {
        name: 'crt_role',
        value: '2',
        category: 'select',
      },
      {
        name: 'prsn_pro[artist]',
        value: true,
        category: 'checkbox',
      },
      {
        name: '血型',
        value: 'A',
      },
      {
        name: '肖像',
        value: {
          dataUrl: 'data:image/png;base64,person',
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
    vi.clearAllMocks();
    renderSubjectDom();
    mockConvertInfoValue.mockReturnValue('converted-infobox');
  });

  test('fillInfoBox populates fields and converts infobox data with mapped names', async () => {
    const typeInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        'table tr:nth-of-type(2) > td:nth-of-type(2) input'
      )
    );
    const firstClickSpy = vi.spyOn(typeInputs[0], 'click');
    const secondClickSpy = vi.spyOn(typeInputs[1], 'click');

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
    const clearClickSpy = vi.spyOn(clearButton, 'click');
    const wikiMode = document.querySelector<HTMLElement>(
      'table small a[href="javascript:void(0)"]'
    )!;
    const wikiClickSpy = vi.spyOn(wikiMode, 'click');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

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
    const wikiClickSpy = vi.spyOn(wikiMode, 'click');

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

  test('fillInfoBox checks checkboxes whose names contain brackets', async () => {
    await fillInfoBox({
      infos: [{ name: 'prsn_pro[artist]', value: true, category: 'checkbox' }],
    });

    expect(
      document.querySelector<HTMLInputElement>('input[name="prsn_pro[artist]"]')
        ?.checked
    ).toBe(true);
  });

  test('fillInfoBox sets select values without leaking them into the infobox', async () => {
    await fillInfoBox({
      infos: [
        { name: 'crt_role', value: '2', category: 'select' },
        { name: '血型', value: 'A' },
      ],
    });

    expect(
      document.querySelector<HTMLSelectElement>('select[name="crt_role"]')?.value
    ).toBe('2');
    expect(mockConvertInfoValue).toHaveBeenCalledWith('{{Infobox}}', [
      { name: '血型', value: 'A' },
    ]);
  });

  test('fillInfoBox leaves subject type inputs alone for drafts without a type', async () => {
    const typeInputs = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        'table tr:nth-of-type(2) > td:nth-of-type(2) input'
      )
    );
    const firstClickSpy = vi.spyOn(typeInputs[0], 'click');

    await fillInfoBox({ infos: [{ name: '血型', value: 'A' }] });

    expect(firstClickSpy).not.toHaveBeenCalled();
  });

  test('initNewPerson wires fill, image widget and person submit', async () => {
    const personInfo = createPersonInfo();

    initNewPerson(personInfo);
    const { fillHandler } = getCapturedHandlers(0);
    await fillHandler(new MouseEvent('click'));

    expect(mockInsertFillFormBtn.mock.calls[0][0]).toBe(
      document.querySelector('form[name=new_character] .character-parent')
    );
    expect(document.querySelector<HTMLInputElement>('#crt_name')?.value).toBe(
      '折戸伸治'
    );
    expect(mockInitImageWidget).toHaveBeenCalledWith(
      document.querySelector('form[name=new_character]'),
      'data:image/png;base64,person'
    );
    expect(mockInitPersonSubmit).toHaveBeenCalledWith(
      personInfo,
      'data:image/png;base64,person'
    );
  });
});
