import {InfoConfig, Selector, SiteConfig} from "../interface/wiki";

export const getchuGameModel: SiteConfig = {
  key: 'getchu_game',
  description: 'Getchu游戏',
  itemList: []
}

const commonSelector: Selector = {
  selector: '#soft_table table',
  subSelector: 'td',
  sibling: true
}
const dict: any = {
  "定価": "售价",
  "発売日": "发行日期",
  "ジャンル": "游戏类型",

  "ブランド": "开发",
  "原画": "原画",
  "音楽": "音乐",
  "シナリオ": "剧本",
  "アーティスト": "主题歌演出",
  "作詞": "主题歌作词",
  "作曲": "主题歌作曲",
}
const configArr = Object.keys(dict).map(key => {
  return {
    name: dict[key],
    selector: {
      keyWord: key,
      ...commonSelector
    }
  } as InfoConfig
})

getchuGameModel.itemList.push(
  {
    name: '游戏名',
    selector: {
      selector: '#soft-title',
    },
    category: 'subject_title'
  },
  {
    name: 'cover',
    selector: {
      selector: '#soft_table .highslide',
    },
    category: 'cover'
  },
  ...configArr,
  {
    name: '游戏简介',
    selector: [
      {
        selector: '#wrapper',
        subSelector: '.tabletitle',
        sibling: true,
        keyWord: 'ストーリー',
      },
      {
        selector: '#wrapper',
        subSelector: '.tabletitle',
        sibling: true,
        keyWord: '商品紹介',
      }
    ],
    category: 'subject_summary'
  }
)
