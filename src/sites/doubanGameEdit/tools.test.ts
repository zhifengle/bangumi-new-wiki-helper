// @vitest-environment jsdom
import { vi } from 'vitest';

const { mockGetImageDataByURL } = vi.hoisted(() => ({
  mockGetImageDataByURL: vi.fn(),
}));

vi.mock('../../utils/dealImage', () => ({
  getImageDataByURL: mockGetImageDataByURL,
}));

import { SingleInfo } from '../../interface/subjectInfo';
import { doubanGameEditTools } from './tools';

describe('douban game edit tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    window.history.replaceState({}, '', '/');
  });

  test('map platform aliases, upgrade cover url and append description', async () => {
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

    const result = (await doubanGameEditTools.hooks?.finalize?.([
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
    ], { kind: 'subject', site: 'douban_game' })) as SingleInfo[];

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
});

