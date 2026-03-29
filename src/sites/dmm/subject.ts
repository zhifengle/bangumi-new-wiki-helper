import {
  InfoConfig,
  Selector,
  SelectorInput,
  SubjectSourceDefinition,
  SubjectTypeId,
} from '../../interface/wiki';

const modernTitleSelector: Selector = {
  selector: 'h1.productTitle__item--headline',
};

const modernControlSelector: Selector = {
  ...modernTitleSelector,
  closest: '.productTitle',
};

export const dmmSubject: SubjectSourceDefinition = {
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
    modernTitleSelector,
  ],
  controlSelector: [{ selector: 'h1#title' }, modernControlSelector],
  itemList: [],
};

const legacyInfoSelector: Selector = {
  selector: '.main-area-center .container02 table',
  subSelector: 'tr',
  nextSelector: {
    selector: '.type-right',
  },
};

const modernInfoSelector: Selector = {
  selector: '.productLayout__secondaryColumn',
  subSelector:
    '.contentsDetailTop__tableDataLeft > p, .contentsDetailBottom__tableDataLeft > p',
  closest: '.contentsDetailTop__tableRow, .contentsDetailBottom__tableRow',
  nextSelector: {
    selector:
      '.contentsDetailTop__tableDataRight, .contentsDetailBottom__tableDataRight',
  },
};

function createInfoSelector(keyWord: string[]): SelectorInput {
  return [
    {
      ...legacyInfoSelector,
      keyWord,
      nextSelector: {
        selector: '.type-right',
      },
    },
    {
      ...modernInfoSelector,
      keyWord,
      nextSelector: {
        selector:
          '.contentsDetailTop__tableDataRight, .contentsDetailBottom__tableDataRight',
      },
    },
  ];
}
const arrDict: Array<{
  name: string;
  key: string[];
  category?: InfoConfig['category'];
}> = [
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
    selector: createInfoSelector(obj.key),
  } as InfoConfig;
  if (obj.category) {
    r.category = obj.category;
  }
  return r;
});
dmmSubject.itemList.push(
  {
    name: '游戏名',
    selector: [
      {
        selector: '#title',
      },
      modernTitleSelector,
      {
        selector: 'meta[property="og:title"]',
      },
    ],
    category: 'subject_title',
  },
  {
    name: '开发',
    selector: createInfoSelector(['ブランド']),
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
    selector: {
      selector: '.read-text-area .text-overflow',
    },
    category: 'subject_summary',
  }
);

dmmSubject.defaultInfos = [
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

