import {
  InfoConfig,
  Selector,
  SiteConfig,
  SubjectTypeId,
} from '../interface/wiki';

export const dlsiteGameModel: SiteConfig = {
  key: 'dlsite_game',
  description: 'dlsite游戏',
  host: ['dlsite.com', 'www.dlsite.com'],
  type: SubjectTypeId.game,
  pageSelectors: [
    {
      selector: '.floorTab-item.type-doujin.is-active',
    },
    {
      selector: '.floorTab-item.type-com.is-active',
    },
  ],
  controlSelector: [
    {
      selector: '#work_name',
    },
  ],
  itemList: [],
};

const commonSelector: Selector = {
  selector: '#work_outline',
  subSelector: 'th',
  sibling: true,
};
const arrDict = [
  {
    name: '发行日期',
    key: ['販売日', '贩卖日'],
    categrory: 'date',
  },
  // {
  //   name: '游戏类型',
  //   key: ['ジャンル', '分类'],
  // },
  {
    name: '作者',
    key: ['作者'],
  },
  {
    name: '原画',
    key: ['イラスト', '插画'],
  },
  {
    name: '剧本',
    key: ['シナリオ', '剧情'],
  },
  {
    name: '声优',
    key: ['声優', '声优'],
  },
  {
    name: '音乐',
    key: ['音乐', '音楽'],
  },
];

const configArr = arrDict.map((obj) => {
  const r = {
    name: obj.name,
    selector: {
      keyWord: obj.key,
      ...commonSelector,
    },
  } as InfoConfig;
  if (obj.categrory) {
    r.category = obj.categrory;
  }
  return r;
});
dlsiteGameModel.itemList.push(
  {
    name: '游戏名',
    selector: {
      selector: '#work_name',
    },
    category: 'subject_title',
  },
  {
    // name: '社团名',
    name: '开发',
    selector: [
      {
        selector: '#work_maker .maker_name a',
      },
    ],
  },
  ...configArr,
  {
    name: 'cover',
    selector: [
      {
        selector:
        '#work_left  div.slider_body_inner.swiper-container-horizontal > ul > li.slider_item:first-child > picture > img',
      },
    ],
    category: 'cover',
  },
  {
    name: '游戏简介',
    selector: [
      {
        selector: '.work_parts_container',
        subSelector: '.work_parts_heading',
        keyWord: 'あらすじ',
        sibling: true,
      },
      {
        selector: '#intro-title + div',
      },
    ],
    category: 'subject_summary',
  },
  {
    name: 'website',
    selector: [
      {
        selector: '#work_name > a',
      },
    ],
    category: 'website',
  }
);

dlsiteGameModel.defaultInfos = [
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
