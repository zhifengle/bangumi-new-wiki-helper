import {
  BangumiDomain,
  changeDomain,
  matchSubjectCandidates,
  Protocol,
} from './index';
import type { SearchResult } from '../../interface/subjectInfo';
import { randomNum } from '../../utils/utils';
import { book } from '../../data/subject';
import { convertInfoValue } from './newSubject';
import { getSubjectId } from './common';

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
  test('test get subject id', () => {
    expect(getSubjectId('https://bgm.tv/character/78638')).toEqual('78638');
    expect(getSubjectId('https://bgm.tv/subject/311538')).toEqual('311538');
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
  expect(convertInfoValue(str, infos)).toEqual(`{{Infobox Game
|中文名=
|平台={
[PC]
[PS4]
}
|游戏类型=ADV
|游戏开发商=
|游戏出版商=
|发行商=
|游戏设计师=
|游戏引擎=
|游玩人数=
|发行日期=2020-08-28
|售价=￥9,800
|官方网站=
|开发=jj
|原画=123
|剧本=xxxx xx
}}`);
});

describe('subject duplicate matching', () => {
  const candidates: SearchResult[] = [
    {
      name: 'Test Game',
      releaseDate: '2024-01-02',
      url: '/subject/1',
    },
    {
      name: 'Test Game',
      releaseDate: '2023-03-04',
      url: '/subject/2',
    },
    {
      name: 'Test Games',
      releaseDate: '2024-01-02',
      url: '/subject/3',
    },
    {
      name: 'Unrelated title',
      url: '/subject/4',
    },
  ];

  test('automatically accepts one candidate with a verified ISBN', () => {
    expect(matchSubjectCandidates(candidates, {
      name: 'Different title',
      isbn: '978-4-1234-5678-9',
    }, {
      verifiedISBNUrls: new Set(['/subject/2']),
    })).toEqual(candidates[1]);
  });

  test('keeps duplicate ISBN records for human review', () => {
    expect(matchSubjectCandidates(candidates, {
      name: 'Test Game',
      isbn: '978-4-1234-5678-9',
    }, {
      verifiedISBNUrls: new Set(['/subject/1', '/subject/2']),
    })).toEqual({ candidates: candidates.slice(0, 2) });
  });

  test('ranks the matching date first when multiple exact titles need review', () => {
    expect(matchSubjectCandidates([candidates[1], candidates[0]], {
      name: 'Ｔｅｓｔ Game',
      releaseDate: '2024/1/2',
    })).toEqual({ candidates: candidates.slice(0, 2) });
  });

  test('requires review when only the title agrees', () => {
    const result = matchSubjectCandidates(candidates, { name: 'Test Game' });

    expect(result).toMatchObject({
      candidates: [candidates[0], candidates[1], candidates[2]],
    });
  });

  test.each([
    { name: 'Half-Life 2 - Episode One -', mainTitle: 'Half-Life 2' },
    { name: 'サクラノ詩－櫻の森の上を舞う－', mainTitle: 'サクラノ詩' },
  ])('ranks $name ahead of fuzzy titles when its main title matches', ({ name, mainTitle }) => {
    const fuzzy = { name: `${mainTitle} Plus`, url: '/subject/1' };
    const withSubtitle = { name, releaseDate: '2006-06-01', url: '/subject/2' };

    expect(matchSubjectCandidates([fuzzy, withSubtitle], {
      name: mainTitle,
      releaseDate: '2006-06-01',
    })).toEqual({ candidates: [withSubtitle, fuzzy] });
  });

  test.each([
    'Half-Life 2-Episode-One-',
    'Half-Life 2－Episode-One－',
  ])('leaves %s in fuzzy order when its hyphens join Latin words', (name) => {
    const fuzzy = { name: 'Half-Life 2.1', url: '/subject/1' };
    const withSubtitle = {
      name,
      releaseDate: '2006-06-01',
      url: '/subject/2',
    };

    expect(matchSubjectCandidates([fuzzy, withSubtitle], {
      name: 'Half-Life 2',
      releaseDate: '2006-06-01',
    })).toEqual({ candidates: [fuzzy, withSubtitle] });
  });

  test('does not let title and date override an unverified source ISBN', () => {
    expect(matchSubjectCandidates([candidates[0]], {
      name: 'Test Game',
      releaseDate: '2024-01-02',
      isbn: '978-4-0000-0000-0',
    })).toEqual({ candidates: [candidates[0]] });
  });
});
