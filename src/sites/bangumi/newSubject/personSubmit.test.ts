// @vitest-environment jsdom
import { vi } from 'vitest';

const { mockSendForm, mockSendFormImg, mockInsertLoading, mockInsertLogInfo } =
  vi.hoisted(() => ({
    mockSendForm: vi.fn(),
    mockSendFormImg: vi.fn(),
    mockInsertLoading: vi.fn(),
    mockInsertLogInfo: vi.fn(),
  }));

vi.mock('../../../utils/ajax', () => ({
  sendForm: mockSendForm,
  sendFormImg: mockSendFormImg,
}));

vi.mock('../imageWidget', () => ({
  insertLoading: mockInsertLoading,
}));

vi.mock('../common', () => ({
  genLinkText: vi.fn(() => 'link'),
  getBgmHost: vi.fn(() => 'https://bgm.tv'),
  getSubjectId: vi.fn(() => '999'),
  insertLogInfo: mockInsertLogInfo,
}));

vi.mock('../related', () => ({
  addPersonRelatedCV: vi.fn(),
  addPersonRelatedSubject: vi.fn(),
  addMusicEp: vi.fn(),
  searchCVByName: vi.fn(),
  uploadSubjectCover: vi.fn(),
}));

vi.mock('../../../utils/async/sleep', () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

import { initPersonSubmit } from './submit';

function renderPersonForm(canvasWidth: number) {
  document.body.innerHTML = `
    <table><tr><td><small>
      <a href="javascript:void(0)">wiki</a>
      <a href="javascript:void(0)">newbie</a>
    </small></td></tr></table>
    <form name="new_character"></form>
    <div class="e-wiki-cover-container">
      <input name="submit" type="button" value="old" />
    </div>
    <canvas id="e-wiki-cover-preview" width="${canvasWidth}" height="${canvasWidth}"></canvas>
  `;
}

function armSubmit(dataUrl: string, navigate: (url: string) => void) {
  vi.useFakeTimers();
  initPersonSubmit({ infos: [] }, dataUrl, { navigate });
  vi.advanceTimersByTime(300);
  vi.useRealTimers();
  return document.querySelector<HTMLInputElement>(
    '.e-wiki-cover-container [name=submit]'
  )!;
}

describe('initPersonSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsertLoading.mockReturnValue(document.createElement('div'));
  });

  test('submits the form without a portrait and navigates to the new person', async () => {
    renderPersonForm(8);
    mockSendForm.mockResolvedValue('https://bgm.tv/person/999');
    const navigate = vi.fn();

    const button = armSubmit('', navigate);
    expect(button.value).toBe('添加人物并上传肖像');
    button.click();

    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('https://bgm.tv/person/999');
    });
    expect(mockSendForm).toHaveBeenCalledWith(
      document.querySelector('form[name=new_character]')
    );
    expect(mockSendFormImg).not.toHaveBeenCalled();
  });

  test('uploads the edited canvas as the portrait when one is present', async () => {
    renderPersonForm(120);
    const canvas = document.querySelector<HTMLCanvasElement>(
      '#e-wiki-cover-preview'
    )!;
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/png;base64,edited');
    mockSendFormImg.mockResolvedValue('https://bgm.tv/person/1000');
    const navigate = vi.fn();

    const button = armSubmit('data:image/png;base64,original', navigate);
    button.click();

    await vi.waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('https://bgm.tv/person/1000');
    });
    expect(mockSendFormImg).toHaveBeenCalledWith(
      document.querySelector('form[name=new_character]'),
      'data:image/png;base64,edited'
    );
    expect(mockSendForm).not.toHaveBeenCalled();
  });
});
