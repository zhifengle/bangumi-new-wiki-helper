import { BangumiDomain, changeDomain, Protocol } from './index';
import { randomNum } from '../../utils/utils';
import { book } from '../../data/subject';
import { convertInfoValue } from './newSubject';

describe('test bangumi sites function', () => {
  it('test convert info', () => {
    const rawInfo = `
{{Infobox animanga/Manga
|中文名=
|出版社= *
|价格=
|作画=
|其他出版社=
|连载杂志=
|发售日=
|页数=
|话数=
|其他=
}}
    `;
    const infoArr = [...book.infos];
    expect(convertInfoValue(rawInfo, infoArr)).toEqual(`{{Infobox animanga/Manga
|中文名=
|作者=宮尾 岳
|出版社=少年画報社
|价格=
|作画=
|其他出版社=
|连载杂志=
|发售日=2019-02-16
|页数=162
|话数=
|其他=
|名称=test
|内容简介=test summary
|ISBN=978-4785963811
}}`);
  });
  it('test change domain', () => {
    let testArr = [
      BangumiDomain.bangumi,
      BangumiDomain.chii,
      BangumiDomain.bgm,
    ];
    const origin = testArr.splice(randomNum(2, 0), 1)[0];
    const target = testArr.splice(randomNum(1, 0), 1)[0];
    expect(
      changeDomain(`https://${origin}/new_subject/4`, target as any)
    ).toEqual(`https://${target}/new_subject/4`);
    expect(
      changeDomain(
        `https://${origin}/new_subject/4`,
        target as any,
        Protocol.http
      )
    ).toEqual(`http://${target}/new_subject/4`);
  });
});

test('test new game', () => {
  const str = `{{Infobox Game
|中文名=
|平台={
}
|游戏类型=
|游戏开发商=
|游戏出版商=
|发行商=
|游戏设计师=
|游戏引擎=
|游玩人数=
|发行日期=
|售价=
|官方网站=
}}
`;
  const infos = [
    {
      name: '售价',
      value: '￥9,800',
    },
    {
      name: '发行日期',
      value: '2020/08/28',
      category: 'date',
    },
    {
      name: '游戏类型',
      value: 'ADV',
    },
    {
      name: '开发',
      value: 'jj',
    },
    {
      name: '原画',
      value: '123',
    },
    {
      name: '剧本',
      value: 'xxxx xx',
    },
    {
      name: '平台',
      value: 'PC',
      category: 'platform',
    },
    {
      name: '平台',
      value: 'PS4',
      category: 'platform',
    },
  ];
  console.log(convertInfoValue(str, infos));
});
