import {
  InfoConfig,
  Selector,
  SiteConfig,
  SubjectTypeId,
} from '../interface/wiki';

export const erogamescapeModel: SiteConfig = {
  key: 'erogamescape',
  description: 'erogamescape',
  host: ['erogamescape.org', 'erogamescape.dyndns.org'],
  type: SubjectTypeId.game,
  pageSelectors: [
    {
      selector: '#soft-title',
    },
  ],
  controlSelector: {
    selector: '#soft-title',
  },
  itemList: [],
};

erogamescapeModel.itemList.push(
  {
    name: '游戏名',
    selector: {
      selector: '#soft-title > span',
    },
    category: 'subject_title',
  },
  {
    name: '开发',
    selector: {
      selector: '#brand a',
    },
  },
  {
    name: '发行日期',
    selector: {
      selector: '#sellday a',
    },
    category: 'date',
  },
  {
    name: 'cover',
    selector: {
      selector: '#image_and_basic_infomation img',
    },
    category: 'cover',
  },
  {
    name: 'website',
    selector: [
      {
        selector: '#links',
        subSelector: 'a',
        keyWord: 'game_OHP',
      },
      {
        selector: '#bottom_inter_links_main',
        subSelector: 'a',
        keyWord: 'game_OHP',
      },
    ],
    category: 'website',
  },
  {
    name: '原画',
    selector: {
      selector: '#genga > td:last-child',
    },
  },
  {
    name: '剧本',
    selector: {
      selector: '#shinario > td:last-child',
    },
  },
  {
    name: '歌手',
    selector: {
      selector: '#kasyu > td:last-child',
    },
  }
);
