import { PersonSourceDefinition } from '../../interface/wiki';

// ref links
// https://vgmdb.net/artist/1
// https://vgmdb.net/artist/2
// https://vgmdb.net/artist/3

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
  itemList: [],
};
