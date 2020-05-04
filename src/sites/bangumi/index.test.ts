import {BangumiDomain, changeDomain, Protocol} from "./index";
import {randomNum} from "../../utils/utils";
import {book} from "../../data/subject";
import {convertInfoValue} from "./newSubject";

describe('test bangumi sites function', () => {
  it('test convert info', () => {
    const rawInfo = `
{{Infobox animanga/Manga
|中文名= 
|别名={
}
|出版社=
|价格=
|其他出版社= 
|连载杂志= 
|发售日=
|册数= 
|页数=
|话数= 
|ISBN=
|其他= 
|ASIN=
|作者=
}}
    `
    const infoArr = [...book.infos]
    console.log(convertInfoValue(rawInfo, infoArr))
  })
  it('test change domain', () => {
    let domainArr = [BangumiDomain.bangumi, BangumiDomain.chii, BangumiDomain.bgm]
    const origin = domainArr.splice(randomNum(2, 0), 1)
    const target = domainArr.splice(randomNum(1, 0), 1)
    expect(changeDomain(`https://${origin}/new_subject/4`, target as any))
      .toEqual(`https://${target}/new_subject/4`)
    expect(changeDomain(
      `https://${origin}/new_subject/4`,
      target as any,
      Protocol.http
    ))
      .toEqual(`http://${target}/new_subject/4`)
  })
})

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
      "name": "售价",
      "value": "￥9,800"
    },
    {
      "name": "发行日期",
      "value": "2020/08/28",
      "category": "date"
    },
    {
      "name": "游戏类型",
      "value": "ADV"
    },
    {
      "name": "开发",
      "value": "jj"
    },
    {
      "name": "原画",
      "value": "123"
    },
    {
      "name": "剧本",
      "value": "xxxx xx"
    },
    {
      "name": "平台",
      "value": "PC",
      "category": "platform"
    }
  ];
  console.log(convertInfoValue(str, infos))
})
