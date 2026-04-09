import { Selector, SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';

// ref links
// https://vgmdb.net/album/9683
// https://vgmdb.net/album/134285
// https://vgmdb.net/album/122607
// https://vgmdb.net/album/86808

export const vgmdbSubject: SubjectSourceDefinition = {
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


vgmdbSubject.itemList.push(
  // ---- Info table fields ----
  {
    name: '厂牌',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Label',
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '条形码',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Barcode',
      },
    ],
    pipes: ['t'],
  },
  {
    name: '发售日期',
    selector: [
      {
        ...commonSelectors,
        keyWord: 'Release Date',
        nextSelector: {
          selector: 'a',
        },
      },
    ],
    pipes: ['date'],
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
  // ---- Credits fields ----
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
        keyWord: ['Composer', 'Music Written by', 'Composed by', 'Music by'],
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '作词',
    selector: [
      {
        ...creditsSelectors,
        keyWord: ['Lyricist', 'Lyrics', 'Lyrics Written by', 'Words by'],
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '编曲',
    selector: [
      {
        ...creditsSelectors,
        keyWord: ['Arranger', 'Arranged by', 'Arrangement'],
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '声乐',
    selector: [
      {
        ...creditsSelectors,
        keyWord: ['Vocal', 'Vocals', 'Chorus'],
      },
    ],
    pipes: ['ti'],
  },
  // 乐器: handled in afterGetWikiData (multiple credit rows)
  {
    name: '录音',
    selector: [
      {
        ...creditsSelectors,
        keyWord: ['Recording', 'Recording Engineer', 'Recorded by'],
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '混音',
    selector: [
      {
        ...creditsSelectors,
        keyWord: ['Mixing', 'Mixing Engineer', 'Mixed by'],
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '母带制作',
    selector: [
      {
        ...creditsSelectors,
        keyWord: ['Mastering', 'Mastering Engineer', 'Mastered by'],
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '制作人',
    selector: [
      {
        ...creditsSelectors,
        keyWord: [
          'Producer', 'Executive Producer', 'Music Producer',
          'Produced by', 'All Songs Produced by',
        ],
      },
    ],
    pipes: ['ti'],
  },
  {
    name: '插图',
    selector: [
      {
        ...creditsSelectors,
        keyWord: [
          'Illustrator', 'Illustration', 'Jacket Design',
          'Jacket Illustration', 'Cover Art', 'Art Direction',
        ],
      },
    ],
    pipes: ['ti'],
  }
);

