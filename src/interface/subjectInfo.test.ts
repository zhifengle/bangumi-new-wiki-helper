import {
  getCoverValue,
  getStringValue,
  isTrackListValue,
  SingleInfoValue,
} from './subjectInfo';

describe('subject shared value model', () => {
  test('getStringValue normalizes scalar values', () => {
    expect(getStringValue('条目名')).toBe('条目名');
    expect(getStringValue(42)).toBe('42');
    expect(getStringValue(true)).toBe('true');
    expect(getStringValue({ dataUrl: 'data:image/png;base64,1' }, 'fallback')).toBe(
      'fallback'
    );
  });

  test('getCoverValue only returns cover-like objects', () => {
    expect(
      getCoverValue({
        url: 'https://example.com/cover.jpg',
        dataUrl: 'data:image/jpeg;base64,cover',
      })
    ).toEqual({
      url: 'https://example.com/cover.jpg',
      dataUrl: 'data:image/jpeg;base64,cover',
    });
    expect(getCoverValue('https://example.com/cover.jpg')).toBeUndefined();
  });

  test('isTrackListValue recognizes disc track arrays', () => {
    const validValue: SingleInfoValue = [
      [
        {
          title: 'Track 1',
          duration: '01:23',
        },
      ],
    ];

    expect(isTrackListValue(validValue)).toBe(true);
    expect(isTrackListValue(['Track 1'])).toBe(false);
  });
});
