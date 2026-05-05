import { moepediaTools } from './tools';

describe('moepedia tools', () => {
  test('finalize normalizes text fields and preserves structured cover values', async () => {
    const finalize = moepediaTools.hooks?.finalize;
    const cover = {
      url: 'https://moepedia.net/cover.jpg',
      dataUrl: 'data:image/jpeg;base64,cover',
    };

    expect(finalize).toBeDefined();
    await expect(
      finalize?.([
        { name: '游戏名', value: 'Demo 通常版', category: 'subject_title' },
        { name: '售价', value: '税込¥9,800' },
        { name: '原画', value: 'Artist A\n  Artist B' },
        { name: 'cover', value: cover, category: 'cover' },
      ], { kind: 'subject', site: 'moepedia' })
    ).resolves.toEqual([
      { name: '游戏名', value: 'Demo', category: 'subject_title' },
      { name: '售价', value: '¥9,800' },
      { name: '原画', value: 'Artist A, Artist B' },
      { name: 'cover', value: cover, category: 'cover' },
    ]);
  });
});
