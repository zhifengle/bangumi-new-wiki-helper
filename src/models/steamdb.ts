import {
  InfoConfig,
  Selector,
  SiteConfig,
  SubjectTypeId,
} from '../interface/wiki'

export const steamdbModel: SiteConfig = {
  key: 'steamdb_game',
  description: 'steamdb',
  host: ['steamdb.info'],
  type: SubjectTypeId.game,
  pageSelectors: [
    {
      selector: '.pagehead h1',
    },
  ],
  controlSelector: {
    selector: '.pagehead h1',
  },
  itemList: [],
}

const commonSelector: Selector = {
  selector: '.scope-app .app-row table',
  subSelector: 'td',
  sibling: true,
}
const dictArr = [
  {
    name: '发行日期',
    keyWord: 'Release Date',
  },
  {
    name: '开发',
    keyWord: 'Developer',
  },
  {
    name: '发行',
    keyWord: 'Publisher',
  },
]
const configArr = dictArr.map((item) => {
  const r = {
    name: item.name,
    selector: {
      keyWord: item.keyWord,
      ...commonSelector,
    },
  } as InfoConfig
  if (item.name === '发行日期') {
    r.category = 'date'
  }
  return r
})

const detailsTableSelector: Selector = {
  selector: '#info table',
  subSelector: 'td',
  sibling: true,
}
const subTableSelector: Selector = {
  selector: 'table.web-assets',
  subSelector: 'td',
  sibling: true,
}
steamdbModel.itemList.push(
  {
    name: '游戏名',
    selector: {
      selector: '.pagehead h1',
    },
    category: 'subject_title',
  },
  {
    name: '中文名',
    selector: [
      {
        ...detailsTableSelector,
        keyWord: 'name_localized',
        nextSelector: {
          ...subTableSelector,
          keyWord: 'schinese',
        },
      },
      {
        ...detailsTableSelector,
        keyWord: 'name_localized',
        nextSelector: {
          ...subTableSelector,
          keyWord: 'tchinese',
        },
      },
    ],
  },
  {
    name: '别名',
    // name: '日文名',
    selector: [
      {
        ...detailsTableSelector,
        keyWord: 'name_localized',
        nextSelector: {
          ...subTableSelector,
          keyWord: 'japanese',
        },
      },
    ],
    category: 'alias',
  },
  {
    name: 'cover',
    selector: [
      {
        ...detailsTableSelector,
        keyWord: 'library_assets',
        nextSelector: {
          selector: 'table.web-assets',
          subSelector: 'td',
          keyWord: 'library_capsule',
          sibling: true,
          nextSelector: {
            selector: 'a',
          },
        },
      },
      {
        ...detailsTableSelector,
        keyWord: 'Web Assets',
        nextSelector: {
          selector: 'table.web-assets',
          subSelector: 'td > a',
          keyWord: 'library_600x900',
        },
      },
    ],
    category: 'cover',
  },
  ...configArr
)

steamdbModel.defaultInfos = [
  {
    name: '平台',
    value: 'PC',
    category: 'platform',
  },
]
