import { Selector, SiteConfig, SubjectTypeId } from '../interface/wiki';

// ref links
// https://vgmdb.net/album/9683
// https://vgmdb.net/album/134285

export const vgmdbModel: SiteConfig = {
  key: 'vgmdb',
  description: 'vgmdb',
  host: ['vgmdb.net'],
  type: SubjectTypeId.music,
  pageSelectors: [
    {
      selector: '#innermain > h1',
    },
  ],
  controlSelector: {
    selector: '#innermain > h1',
  },
  itemList: [],
};

const commonSelectors: Selector = {
  selector: '#album_infobit_large',
  subSelector: 'tr > td:first-child',
  sibling: true,
};

const creditsSelectors: Selector = {
  selector: '#collapse_credits table',
  subSelector: 'tr > td:first-child',
  sibling: true,
};


vgmdbModel.itemList.push(
  // afterGetWikiData 里面
  // {
  //   name: '唱片名',
  //   selector: {
  //     selector: '#innermain > h1 > [lang=ja]',
  //   },
  //   category: 'subject_title',
  // },
  {
    name: '录音',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Organizations',
      },
    ],
  },
  {
    name: '发售日期',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Release Date',
      },
    ],
    pipes: ['date']
  },
  {
    name: '价格',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Price',
      },
    ],
  },
  {
    name: '版本特性',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Media Format',
      },
    ],
  },
  {
    name: '播放时长',
    selector: [
      {
        selector: '#tracklist',
        subSelector: 'span.smallfont',
        sibling: true,
        keyWord: 'Total length',
      },
      {
        selector: '#tracklist',
        subSelector: 'span.smallfont',
        sibling: true,
        keyWord: 'Disc length',
      },
    ],
  },
  {
    name: '艺术家',
    selector: [
      {
        ...creditsSelectors,
        keyWord: ['Performer', 'Vocalist'],
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '作曲',
    selector: [
      {
        ...creditsSelectors,
        keyWord: 'Composer',
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '作词',
    selector: [
      {
        ...creditsSelectors,
        keyWord: ['Lyricist', 'Lyrics'],
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '编曲',
    selector: [
      {
        ...creditsSelectors,
        keyWord: 'Arranger',
      },
    ],
    pipes: ['ti'],
  }
);
