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