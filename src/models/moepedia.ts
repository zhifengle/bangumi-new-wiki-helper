import { Selector, SiteConfig, SubjectTypeId } from '../interface/wiki';

export const moepedia: SiteConfig = {
  key: 'moepedia',
  description: 'moepedia.net',
  host: ['moepedia.net'],
  type: SubjectTypeId.game,
  pageSelectors: [
    {
      selector: '.gme-Contents > .gme-Body',
    },
  ],
  controlSelector: [
    {
      selector: '.body-top_info_title > h2',
    },
  ],
  itemList: [],
};

const topTableSelector: Selector = {
  selector:
    'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-top > div.body-top_table.body-table > table',
  subSelector: 'tr > th',
  sibling: true,
};

const middleTableSelector: Selector = {
  selector:
    'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-middle',
  subSelector: 'tr > th',
  sibling: true,
};

moepedia.itemList.push(
  {
    name: '游戏名',
    selector: {
      selector: 'div.gme-Contents h2',
    },
    category: 'subject_title',
  },
  {
    name: '发行日期',
    selector: [
      {
        ...topTableSelector,
        keyWord: '発売日',
      },
    ],
    pipes: ['date'],
  },
  {
    name: '售价',
    selector: [
      {
        ...topTableSelector,
        keyWord: '価格',
      },
    ],
    pipes: ['p'],
  },
  {
    name: 'website',
    selector: [
      {
        selector:
          'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-top > div.body-top_table.body-table > div > a',
      },
    ],
    category: 'website',
  },
  {
    name: 'cover',
    selector: [
      {
        selector: 'div.gme-Contents div.body-top > div.body-top_image img',
      },
    ],
    category: 'cover',
  },
  {
    name: '原画',
    selector: {
      ...middleTableSelector,
      keyWord: ['原画'],
    },
  },
  {
    name: '开发',
    selector: {
      ...middleTableSelector,
      keyWord: ['ブランド'],
    },
  },
  {
    name: '剧本',
    selector: {
      ...middleTableSelector,
      keyWord: ['シナリオ'],
    },
  },
  {
    name: '游戏类型',
    selector: {
      ...middleTableSelector,
      keyWord: ['ジャンル'],
    },
  },
  {
    name: '音乐',
    selector: {
      ...middleTableSelector,
      keyWord: ['音楽'],
    },
  },
  {
    name: '主题歌演唱',
    selector: {
      ...middleTableSelector,
      keyWord: ['歌手'],
    },
  }
);

moepedia.defaultInfos = [
  {
    name: '平台',
    value: 'PC',
    category: 'platform',
  },
  {
    name: 'subject_nsfw',
    value: '1',
    category: 'checkbox',
  },
];
