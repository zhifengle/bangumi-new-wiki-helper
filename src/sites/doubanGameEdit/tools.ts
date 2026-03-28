import { SingleInfo } from '../../interface/subjectInfo';
import { getImageDataByURL } from '../../utils/dealImage';
import { SiteTools } from '../catalogTypes';
import {
  DOUBAN_GAME_PLATFORM_MAP,
  getDoubanDescriptionInfos,
  hasCoverUrl,
  normalizeCommaDelimitedValue,
  splitInfoValues,
} from '../douban/shared';

export const doubanGameEditTools: SiteTools = {
  hooks: {
    async beforeCreate() {
      const href = window.location.href;
      return /\/game\/\d+\/edit/.test(href);
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const result: SingleInfo[] = [];
      for (const info of infos) {
        if (['平台', '别名'].includes(info.name)) {
          result.push(...splitInfoValues(info, ',', DOUBAN_GAME_PLATFORM_MAP));
          continue;
        }
        if (info.category === 'cover' && hasCoverUrl(info.value)) {
          try {
            const url = info.value.url.replace('/spic/', '/lpic/');
            const dataUrl = await getImageDataByURL(url);
            result.push({
              ...info,
              value: {
                dataUrl,
                url,
              },
            });
          } catch (error) {
            console.error(error);
          }
          continue;
        }
        if (info.name === '游戏类型' || info.name === '开发') {
          result.push({
            ...info,
            value: normalizeCommaDelimitedValue(info.value),
          });
          continue;
        }
        result.push({ ...info });
      }
      result.push(...getDoubanDescriptionInfos());
      return result;
    },
  },
  filters: [],
};


