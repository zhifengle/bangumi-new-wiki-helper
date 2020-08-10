import { SiteConfig, SubjectTypeId, Selector } from '../interface/wiki';

export const doubanGameEditModel: SiteConfig = {
  key: 'douban_game_edit',
  description: 'douban game edit',
  host: ['douban.com'],
  type: SubjectTypeId.game,
  pageSelectors: [
    {
      selector: '#content h1',
    },
  ],
  controlSelector: {
    selector: '#content h1',
  },
  itemList: [],
};

const gameAttr: Selector = {
  selector: '#thing-modify .thing-item .operation',
  subSelector: '.label',
  sibling: true,
};

doubanGameEditModel.itemList.push(
  {
    name: '游戏名',
    selector: [
      {
        ...gameAttr,
        keyWord: '原名',
      },
      {
        ...gameAttr,
        keyWord: '中文名',
      },
    ],
    category: 'subject_title',
  },
  {
    name: '发行日期',
    selector: [
      {
        ...gameAttr,
        keyWord: '发行日期',
      },
      {
        ...gameAttr,
        keyWord: '预计上市时间',
      },
    ],
    category: 'date',
  },
  {
    name: '平台',
    selector: {
      ...gameAttr,
      keyWord: '平台',
    },
    category: 'platform',
  },
  {
    name: '中文名',
    selector: {
      ...gameAttr,
      keyWord: '中文名',
    },
  },
  {
    name: '别名',
    selector: {
      ...gameAttr,
      keyWord: '别名',
    },
    category: 'alias',
  },
  {
    name: '游戏类型',
    selector: {
      ...gameAttr,
      keyWord: '类型',
    },
  },
  {
    name: '开发',
    selector: {
      ...gameAttr,
      keyWord: '开发商',
    },
  },
  {
    name: '发行',
    selector: {
      ...gameAttr,
      keyWord: '发行商',
    },
  },
  // {
  //   name: '游戏简介',
  //   selector: [
  //     {
  //       selector: '#thing_desc_options_0',
  //     },
  //   ],
  //   category: 'subject_summary',
  // },
  {
    name: 'cover',
    selector: {
      ...gameAttr,
      keyWord: '图标',
      nextSelector: {
        selector: 'img',
      },
    },
    category: 'cover',
  }
);
