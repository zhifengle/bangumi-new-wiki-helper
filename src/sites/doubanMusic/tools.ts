import { SingleInfo } from '../../interface/subjectInfo';
import { SiteTools } from '../catalogTypes';
import {
  DOUBAN_MUSIC_FIELD_MAP,
  getDoubanMusicFieldValue,
  getDoubanMusicTracks,
  groupDoubanTracksByDisc,
} from '../douban/shared';

export const doubanMusicTools: SiteTools = {
  hooks: {
    async afterGetWikiData(infos: SingleInfo[]) {
      const result = [...infos];
      const $info = document.querySelector<HTMLElement>('#info');
      if ($info) {
        $info.querySelectorAll<HTMLElement>('.pl').forEach(($field) => {
          const key = $field.textContent?.trim().split(':')[0] ?? '';
          const target = DOUBAN_MUSIC_FIELD_MAP[key];
          const value = getDoubanMusicFieldValue($field);
          if (!target || !value) {
            return;
          }
          result.push({
            ...target,
            value,
          });
        });
      }
      const discCountValue = result.find((item) => item.name === '碟片数量')?.value;
      const discCount = Number.parseInt(String(discCountValue ?? '1'), 10) || 1;
      const discList = groupDoubanTracksByDisc(getDoubanMusicTracks());
      if (discList.length && discList.length === discCount) {
        result.push({
          category: 'ep',
          name: '',
          value: discList,
        });
      } else {
        console.warn('碟片数量不匹配', discCount, discList);
      }
      return result;
    },
  },
  filters: [],
};


