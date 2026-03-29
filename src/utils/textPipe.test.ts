import { dealTextByPipe } from './textPipe';

describe('textPipe Batch F', () => {
  test('dealTextByPipe supports keyword arguments', () => {
    expect(
      dealTextByPipe('发行日期： 2020/01/02', ['k', 't'], {
        k: [['发行日期']],
      })
    ).toBe('2020/01/02');
  });

  test('dealTextByPipe applies built-in and custom pipes', () => {
    expect(dealTextByPipe('价格: 123円', ['num'])).toBe('123');
    expect(dealTextByPipe('作者: 田中', ['label'])).toBe('田中');
    expect(
      dealTextByPipe('発売日: 2020/1/2', ['k', 'date'], {
        k: [['発売日']],
      })
    ).toBe('2020-01-02');
    expect(
      dealTextByPipe(' title ', [
        (pipe) => ({
          ...pipe,
          out: pipe.rawInfo.toUpperCase().trim(),
        }),
      ])
    ).toBe('TITLE');
  });

  test('dealTextByPipe treats string keywords as literal text', () => {
    expect(
      dealTextByPipe('C++: value', ['k', 'label'], {
        k: [['C++']],
      })
    ).toBe('value');
  });

  test('dealTextByPipe supports RegExp keywords explicitly', () => {
    expect(
      dealTextByPipe('(アーティスト) ClariS', ['k', 't'], {
        k: [[/\(アーティスト\)/]],
      })
    ).toBe('ClariS');
  });

  test('pn keeps parenthesized numbers while trimming other parenthesized text', () => {
    expect(dealTextByPipe('Vol.1 (限定版) (1)', ['pn'])).toBe('Vol.1  (1)');
  });

  test('dealTextByPipe preserves empty pipe output', () => {
    expect(
      dealTextByPipe('作者', ['k'], {
        k: [['作者']],
      })
    ).toBe('');
  });
});
