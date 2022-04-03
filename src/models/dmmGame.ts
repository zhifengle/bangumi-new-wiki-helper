import {
  InfoConfig,
  Selector,
  SiteConfig,
  SubjectTypeId,
} from '../interface/wiki';

export const dmmGameModel: SiteConfig = {
  key: 'dmm_game',
  description: 'dmm游戏',
  host: ['dlsoft.dmm.co.jp'],
  type: SubjectTypeId.game,
  pageSelectors: [
    {
      selector: '.ntgnav-mainItem.is-active',
      subSelector: 'span',
      keyWord: 'ゲーム',
    },
  ],
  controlSelector: [
    {
      selector: 'h1#title',
    },
  ],
  itemList: [],
};

const commonSelector: Selector = {
  selector: '.main-area-center .container02 table',
  subSelector: 'tr',
  nextSelector: {
    selector: '.type-right',
  },
};

const contentIframe: Selector = {
  selector: '#if_view',
  isIframe: true,
  subSelector: 'body',
};
const arrDict = [
  {
    name: '发行日期',
    key: ['配信開始日'],
    category: 'date',
  },
  {
    name: '游戏类型',
    key: ['ゲームジャンル'],
  },
  {
    name: '原画',
    key: ['原画'],
  },
  {
    name: '剧本',
    key: ['シナリオ', '剧情'],
  },
  // {
  //   name: '声优',
  //   key: ['声優', '声优'],
  // },
  // {
  //   name: '音乐',
  //   key: ['音乐', '音楽'],
  // },
];

const configArr = arrDict.map((obj) => {
  const r = {
    name: obj.name,
    selector: {
      keyWord: obj.key,
      ...commonSelector,
    },
  } as InfoConfig;
  if (obj.category) {
    r.category = obj.category;
  }
  return r;
});
dmmGameModel.itemList.push(
  {
    name: '游戏名',
    selector: {
      selector: '#title',
    },
    category: 'subject_title',
  },
  {
    name: '开发',
    selector: [
      {
        selector: '.ranking-and-brand .brand',
        subSelector: 'td',
        keyWord: 'ブランド',
        sibling: true,
      },
    ],
  },
  ...configArr,
  // 部分页面的图片是预览图，不少封面。所以改在 hook 里面，提取图片。
  // {
  //   name: 'cover',
  //   selector: [
  //     {
  //       ...contentIframe,
  //       nextSelector: {
  //         selector: '#guide-head > img',
  //       },
  //     },
  //   ],
  //   category: 'cover',
  // },
  {
    name: '游戏简介',
    selector: [
      {
        ...contentIframe,
        nextSelector: {
          selector: '#guide-content',
          subSelector: '.guide-capt',
          keyWord: '作品紹介',
          sibling: true,
        },
      },
      {
        selector: '.read-text-area .text-overflow',
      },
    ],
    category: 'subject_summary',
  }
);

dmmGameModel.defaultInfos = [
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
