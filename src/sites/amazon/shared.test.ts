import { amazonUtils, toAmazonAcSl1500ImageUrl } from './shared';

describe('amazon shared utils', () => {
  test('deal title text', () => {
    const dealTitle = amazonUtils.dealTitle;

    expect(dealTitle('BADON (1) (ビッグガンガンコミックス)')).toEqual(
      'BADON (1)'
    );
    expect(dealTitle('幾日 (WANIMAGAZINE COMICS SPECIAL)')).toEqual('幾日');
    expect(dealTitle('幾日 (WANIMAGAZINE COMICS SPECIAL) (1)')).toEqual(
      '幾日 (WANIMAGAZINE COMICS SPECIAL) (1)'
    );
    expect(
      dealTitle(`
                大蜘蛛ちゃんフラッシュ・バック(2) (アフタヌーンKC)
            `)
    ).toEqual('大蜘蛛ちゃんフラッシュ・バック(2)');
    expect(
      dealTitle(
        '動物のおしゃべり　（１） (バンブーコミックス 4コマセレクション)'
      )
    ).toEqual('動物のおしゃべり　（１）');
  });

  test('converts amazon image urls to AC SL1500 variant', () => {
    expect(
      toAmazonAcSl1500ImageUrl(
        'https://m.media-amazon.com/images/I/51qGNGiTtTL.jpg'
      )
    ).toBe('https://m.media-amazon.com/images/I/51qGNGiTtTL._AC_SL1500_.jpg');

    expect(
      toAmazonAcSl1500ImageUrl(
        'https://m.media-amazon.com/images/I/51qGNGiTtTL._SY445_SX342_.jpg'
      )
    ).toBe('https://m.media-amazon.com/images/I/51qGNGiTtTL._AC_SL1500_.jpg');

    expect(
      toAmazonAcSl1500ImageUrl(
        'https://images-na.ssl-images-amazon.com/images/I/51qGNGiTtTL._AC_UL320_.jpeg?foo=bar'
      )
    ).toBe(
      'https://images-na.ssl-images-amazon.com/images/I/51qGNGiTtTL._AC_SL1500_.jpeg?foo=bar'
    );
  });

  test('does not convert non amazon or non jpeg image urls', () => {
    expect(toAmazonAcSl1500ImageUrl('https://example.com/images/I/a.jpg')).toBe(
      'https://example.com/images/I/a.jpg'
    );
    expect(
      toAmazonAcSl1500ImageUrl(
        'https://m.media-amazon.com/images/I/51qGNGiTtTL.png'
      )
    ).toBe('https://m.media-amazon.com/images/I/51qGNGiTtTL.png');
  });
});
