import { SiteConfig, SubjectTypeId, Selector } from '../interface/wiki';

export const doubanGameModel: SiteConfig = {
  key: 'douban_game',
  description: 'douban game',
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
  selector: '#content .game-attr',
  subSelector: 'dt',
  sibling: true,
};

doubanGameModel.itemList.push(
  {
    name: '游戏名',
    selector: {
      selector: '#content h1',
    },
    category: 'subject_title',
  },
  {
    name: '发行日期',
    selector: {
      ...gameAttr,
      keyWord: '发行日期',
    },
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
  //   name: 'website',
  //   selector: {
  //     selector: '.responsive_apppage_details_left.game_details',
  //   },
  //   category: 'website',
  // },
  {
    name: '游戏简介',
    selector: [
      {
        selector: '.mod.item-desc',
        subSelector: 'h2',
        keyWord: '简介',
        sibling: true,
      },
    ],
    category: 'subject_summary',
  },
  {
    name: 'cover',
    selector: {
      selector: '#content .item-subject-info .pic > a',
    },
    category: 'cover',
  }
);
