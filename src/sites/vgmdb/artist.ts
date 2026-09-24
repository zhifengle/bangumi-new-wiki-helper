import {
  PersonSourceDefinition,
  Selector,
} from '../../interface/wiki';

// ref links
// https://vgmdb.net/artist/1
// https://vgmdb.net/artist/2
// https://vgmdb.net/artist/3

// 左栏资料行形如 <b>Birthdate</b><br>Mar 18, 1977；关键字命中 <b> 后回到整行
function rowSelector(keyWord: string): Selector {
  return {
    selector: '#leftfloat',
    subSelector: 'div > b',
    keyWord,
    closest: 'div',
  };
}

export const vgmdbArtist: PersonSourceDefinition = {
  key: 'vgmdb_artist',
  description: 'VGMdb 艺术家',
  host: ['vgmdb.net'],
  urlRules: [/vgmdb\.net\/artist\/\d+/],
  pageSelectors: {
    selector: '#innermain',
    nextSelector: { selector: '#leftfloat' },
  },
  controlSelector: {
    selector: '#innermain > span[style*="1.5em"]',
  },
  role: 1,
  professions: ['artist'],
  // 多值行（Aliases、Variations、Organizations）与姓名、简介、外链在 personTools 的 hook 里处理。
  // 自由文本行只剥掉行首标签（k）和空白（t），默认管道会误删括号与冒号前的内容。
  itemList: [
    {
      name: '生日',
      selector: rowSelector('Birthdate'),
      category: 'date',
    },
    {
      name: '血型',
      selector: rowSelector('Bloodtype'),
      pipes: ['k', 't'],
    },
    {
      name: '出生地',
      selector: rowSelector('Birthplace'),
      pipes: ['k', 't'],
    },
    {
      name: '毕业院校',
      selector: rowSelector('Education'),
      pipes: ['k', 't'],
    },
    {
      name: '肖像',
      selector: { selector: '#leftfloat a.highslide' },
      category: 'crt_cover',
    },
  ],
};
