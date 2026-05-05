import { SingleInfo } from '../../interface/subjectInfo';
import { SubjectTools } from '../catalogTypes';
import {
  getDoubanModifyUrl,
  getDoubanPlatformLinks,
  normalizeSlashDelimitedValue,
  splitInfoValues,
} from '../douban/shared';

export const doubanGameTools: SubjectTools = {
  hooks: {
    async beforeCreate() {
      const href = window.location.href;
      if (/\/game\//.test(href) && !/\/game\/\d+\/edit/.test(href)) {
        const modifyUrl = getDoubanModifyUrl();
        if (!modifyUrl) {
          return;
        }
        return {
          payload: {
            auxSite: {
              url: modifyUrl,
              prefs: {
                originNames: ['平台', '发行日期'],
                targetNames: 'all',
              },
            },
          },
        };
      }
    },
    async finalize(infos: SingleInfo[]) {
      const result: SingleInfo[] = [];
      for (const info of infos) {
        if (['平台', '别名'].includes(info.name)) {
          result.push(...splitInfoValues(info, '/'));
          continue;
        }
        if (info.category === 'cover') {
          result.push({ ...info });
          continue;
        }
        const normalizedValue = normalizeSlashDelimitedValue(info.value);
        const nextValue =
          info.name === '游戏类型' && typeof normalizedValue === 'string'
            ? normalizedValue.replace(/^游戏,\s*/, '').trim()
            : normalizedValue;
        result.push({
          ...info,
          value: nextValue,
        });
      }
      for (const link of getDoubanPlatformLinks()) {
        result.push({
          name: '平台',
          value: link.textContent?.replace(/\/.*/, '').trim() ?? '',
          category: 'platform',
        });
      }
      return result;
    },
  },
};


