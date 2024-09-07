import { SiteConfig, SubjectTypeId, Selector } from '../interface/wiki';

// ref links
// https://music.douban.com/subject/36072428/
// https://music.douban.com/subject/34956124/

export const doubanMusicModel: SiteConfig = {
  key: 'douban_music',
  description: 'douban music',
  host: ['music.douban.com'],
  type: SubjectTypeId.music,
  pageSelectors: [
    {
      selector: '#db-nav-music',
    },
  ],
  controlSelector: {
    selector: '#wrapper h1',
  },
  itemList: [],
};

const attr: Selector = {
  selector: '#info',
  subSelector: '.pl',
  sibling: true,
};

doubanMusicModel.itemList.push(
  {
    name: '音乐名',
    selector: {
      selector: '#wrapper h1',
    },
    category: 'subject_title',
  },
  // textNode silbing 暂时不支持
  /*
  {
    name: '发售日期',
    selector: [
      {
        ...attr,
        keyWord: '发行时间',
      },
    ],
    category: 'date',
  },
  {
    name: '艺术家',
    selector: [
      {
        ...attr,
        keyWord: '表演者',
      }
    ]
  },
  {
    name: '流派',
    selector: {
      ...attr,
      keyWord: '流派',
    },
  },
  {
    name: '别名',
    selector: {
      ...attr,
      keyWord: '又名',
    },
    category: 'alias',
  },
  {
    name: '版本特性',
    selector: {
      ...attr,
      keyWord: '介质',
    },
  },
  {
    name: '碟片数量',
    selector: {
      ...attr,
      keyWord: '唱片数',
    },
  },
  {
    name: '厂牌',
    selector: {
      ...attr,
      keyWord: '出版者',
    },
  },
  */
  {
    name: '音乐简介',
    selector: [
      {
        selector: '.related_info',
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
      selector: '#mainpic > span > a > img',
    },
    category: 'cover',
  }
);
