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
});
