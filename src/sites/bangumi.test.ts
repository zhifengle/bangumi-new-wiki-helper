import {convertInfoValue} from "./bangumi";

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
    const infoArr = [
      {
        "name": "名称",
        "value": "test",
        "category": "subject_title"
      },
      {
        "name": "ASIN",
        "value": "4785963816",
        "category": "ISBN"
      },
      {
        "name": "ISBN",
        "value": "978-4785963811",
        "category": "ISBN-13"
      },
      {
        "name": "发售日",
        "value": "2019/2/16",
        "category": "date"
      },
      {
        "name": "作者",
        "value": "宮尾 岳"
      },
      {
        "name": "出版社",
        "value": "少年画報社"
      },
      {
        "name": "页数",
        "value": "162"
      }
    ]
    console.log(convertInfoValue(rawInfo, infoArr))
  })
})
