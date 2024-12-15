import {
  InfoConfig,
  Selector,
  SiteConfig,
  SubjectTypeId,
} from '../interface/wiki';

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
    selector: '.pagehead',
  },
  itemList: [],
};

const commonSelector: Selector = {
  selector: '.scope-app .app-row table',
  subSelector: 'td',
  sibling: true,
};
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
  {
    name: '游戏引擎',
    keyWord: 'Technologies',
  }
];
const configArr = dictArr.map((item) => {
  const r = {
    name: item.name,
    selector: {
      keyWord: item.keyWord,
      ...commonSelector,
    },
  } as InfoConfig;
  if (item.name === '发行日期') {
    r.category = 'date';
  }
  return r;
});

const detailsTableSelector: Selector = {
  selector: '#info table',
  subSelector: 'td',
  sibling: true,
};
const subTableSelector: Selector = {
  selector: 'table.web-assets',
  subSelector: 'td',
  sibling: true,
};
const assetsTableSelector: Selector = {
  selector: '#js-assets-table',
  subSelector: 'td',
  sibling: true,
};
steamdbModel.itemList.push(
  {
    name: '游戏名',
    selector: [
      // 默认使用日文名称，当条目名称
      {
        ...detailsTableSelector,
        keyWord: 'name_localized',
        nextSelector: {
          ...subTableSelector,
          keyWord: 'japanese',
        },
      },
      {
        selector: '.pagehead h1',
      },
    ],
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
    category: 'alias',
  },
  {
    name: '游戏类型',
    selector: [
      {
        ...detailsTableSelector,
        keyWord: 'Primary Genre',
      }
    ],
    pipes: ['ta', 'p'],
  },
  {
    name: 'cover',
    selector: [
      {
        ...assetsTableSelector,
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
        ...assetsTableSelector,
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
  ...configArr,
  {
    name: '游戏简介',
    selector: [
      {
        selector: 'head meta[name="description"]',
      },
      {
        selector: '.scope-app header-description',
      },
    ],
    category: 'subject_summary',
  },
  // {
  //   name: 'website',
  //   selector: {
  //     selector: '.app-links a[aria-label^="Games homepage"]',
  //   },
  //   category: 'website',
  // }
);

steamdbModel.defaultInfos = [
  {
    name: '平台',
    value: 'PC',
    category: 'platform',
  },
];
