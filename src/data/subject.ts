import {SubjectWikiInfo} from "../interface/subject";
import {SubjectTypeId} from "../interface/wiki";

export const book: SubjectWikiInfo = {
  type: SubjectTypeId.book,
  subtype: 1,
  infos: [
    {
      "name": "名称",
      "value": "test",
      "category": "subject_title"
    },
    {
      "name": "内容简介",
      "value": "test summary",
      "category": "subject_summary"
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
}
