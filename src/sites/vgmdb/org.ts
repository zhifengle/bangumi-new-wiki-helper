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
  // 名称、人物类型（按 Type 判断）与外链在 personTools 的 hook 里处理
  itemList: [
    {
      name: '人物简介',
      selector: {
        selector: 'dl',
        subSelector: 'dt',
        keyWord: 'Description',
        sibling: true,
      },
      category: 'crt_summary',
    },
    {
      name: '肖像',
      selector: { selector: 'a.highslide' },
      category: 'crt_cover',
    },
  ],
};
