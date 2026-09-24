import { PersonSourceDefinition } from '../../interface/wiki';

// ref links
// https://vgmdb.net/org/1

export const vgmdbOrg: PersonSourceDefinition = {
  key: 'vgmdb_org',
  description: 'VGMdb 组织',
  host: ['vgmdb.net'],
  urlRules: [/vgmdb\.net\/org\/\d+/],
  pageSelectors: {
    selector: 'dl',
    nextSelector: { selector: 'dt.label' },
  },
  controlSelector: {
    selector: 'h1[style*="display: inline"]',
  },
  role: 2,
  professions: ['producer'],
  itemList: [],
};
