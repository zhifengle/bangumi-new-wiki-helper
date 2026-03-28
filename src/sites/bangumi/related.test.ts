/**
 * @jest-environment jsdom
 */
const mockFetchJson = jest.fn();
const mockFetchText = jest.fn();
const mockSendForm = jest.fn();
const mockSendFormImg = jest.fn();
const mockGetBgmHost = jest.fn();
const mockGetFormByIframe = jest.fn();
const mockSleep = jest.fn().mockResolvedValue(undefined);

jest.mock('../../utils/fetchData', () => ({
  fetchJson: (...args: unknown[]) => mockFetchJson(...args),
  fetchText: (...args: unknown[]) => mockFetchText(...args),
}));

jest.mock('../../utils/ajax', () => ({
  sendForm: (...args: unknown[]) => mockSendForm(...args),
  sendFormImg: (...args: unknown[]) => mockSendFormImg(...args),
}));

jest.mock('./common', () => ({
  getBgmHost: (...args: unknown[]) => mockGetBgmHost(...args),
  getFormByIframe: (...args: unknown[]) => mockGetFormByIframe(...args),
}));

jest.mock('../../utils/async/sleep', () => ({
  sleep: (...args: unknown[]) => mockSleep(...args),
}));

import { SubjectTypeId } from '../../interface/wiki';
import {
  addPersonRelatedSubject,
  addSonglist,
  searchCVByName,
  uploadSubjectCover,
} from './related';

describe('bangumi related helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    mockGetBgmHost.mockReturnValue('https://bgm.tv');
    mockSendForm.mockResolvedValue('ok');
    mockSendFormImg.mockResolvedValue('ok');
  });

  test('searchCVByName trims spaces and appends character id', async () => {
    mockFetchJson.mockResolvedValue({
      '123': {
        name: '测试 CV',
      },
    });

    const id = await searchCVByName(' 田 中 ', '45');

    expect(id).toBe('123');
    expect(mockFetchJson).toHaveBeenCalledWith(
      'https://bgm.tv/json/search-cv_person/田中?character_id=45'
    );
  });

  test('uploadSubjectCover falls back to parsed upload form', async () => {
    mockFetchText.mockResolvedValue('<form name="img_upload"></form>');

    await uploadSubjectCover(
      '12',
      'data:image/png;base64,aGVsbG8=',
      'https://bgm.tv'
    );

    expect(mockFetchText).toHaveBeenCalledWith(
      'https://bgm.tv/subject/12/upload_img'
    );
    expect(mockSendFormImg).toHaveBeenCalledWith(
      expect.any(HTMLFormElement),
      'data:image/png;base64,aGVsbG8='
    );
  });

  test('addSonglist submits fallback form data when formhash is unavailable', async () => {
    mockFetchText.mockResolvedValue('<form name="new_songlist"></form>');

    await addSonglist('22', 'Track A\nTrack B', '2');

    expect(mockFetchText).toHaveBeenCalledWith('/subject/22/ep');
    expect(mockSendForm).toHaveBeenCalledWith(expect.any(HTMLFormElement), [
      {
        name: 'songlist',
        value: 'Track A\nTrack B',
      },
      {
        name: 'disc',
        value: '2',
      },
      {
        name: 'submit',
        value: '加上去',
      },
    ]);
  });

  test('addPersonRelatedSubject sends generated relation payload', async () => {
    const $form = document.createElement('form');
    mockGetFormByIframe.mockResolvedValue($form);

    await addPersonRelatedSubject(['1', '2'], '88', SubjectTypeId.game, 2);

    expect(mockGetFormByIframe).toHaveBeenCalledWith(
      'http://localhost/character/88/add_related/game',
      '.mainWrapper form'
    );
    expect(mockSendForm).toHaveBeenCalledWith($form, [
      {
        name: 'infoArr[n0][crt_type]',
        value: 2,
      },
      {
        name: 'infoArr[n0][subject_id]',
        value: '1',
      },
      {
        name: 'infoArr[n1][crt_type]',
        value: 2,
      },
      {
        name: 'infoArr[n1][subject_id]',
        value: '2',
      },
    ]);
  });
});
