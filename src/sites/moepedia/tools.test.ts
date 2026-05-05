import { moepediaTools } from './tools';

describe('moepedia tools', () => {
  test('afterGetWikiData preserves structured cover values', async () => {
    const cover = {
      url: 'https://img.moepedia.net/cover.jpg',
      dataUrl: 'data:image/jpeg;base64,cover',
    };

    const result = await moepediaTools.hooks!.afterGetWikiData!([
      {
        name: 'cover',
        value: cover,
        category: 'cover',
      },
      {
        name: '游戏名',
        value: 'タイトル 限定版',
        category: 'subject_title',
      },
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        {
          name: 'cover',
          value: cover,
          category: 'cover',
        },
      ])
    );
  });
});
