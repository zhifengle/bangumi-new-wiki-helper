import { SingleInfo } from '../interface/subject';
import { getImageDataByURL } from '../utils/dealImage';
import { findElement, getText } from '../utils/domUtils';
import { SiteTools } from './types';

type DoubanTrack = {
  title: string;
  duration?: string;
  order: number;
};

type DoubanMusicField = {
  name: string;
  category?: string;
};

type DoubanCoverValue = {
  url: string;
  dataUrl?: string;
};

const DOUBAN_GAME_PLATFORM_MAP: Record<string, string> = {
  ARC: 'Arcade',
  NES: 'FC',
  红白机: 'FC',
  街机: 'Arcade',
};

const DOUBAN_MUSIC_FIELD_MAP: Record<string, DoubanMusicField> = {
  又名: {
    name: '别名',
    category: 'alias',
  },
  发行时间: {
    name: '发售日期',
    category: 'date',
  },
  介质: {
    name: '版本特性',
  },
  唱片数: {
    name: '碟片数量',
  },
  流派: {
    name: '流派',
  },
  出版者: {
    name: '厂牌',
  },
  表演者: {
    name: '艺术家',
  },
  条形码: {
    name: '条形码',
  },
};

function getDoubanModifyUrl() {
  return document.querySelector<HTMLAnchorElement>('.th-modify > a')?.href;
}

function splitInfoValues(
  info: SingleInfo,
  delimiter: string,
  valueMap: Record<string, string> = {}
) {
  if (typeof info.value !== 'string') {
    return [{ ...info }];
  }
  return info.value
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((value) => ({
      ...info,
      value: valueMap[value] ?? value,
    }));
}

function normalizeSlashDelimitedValue(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }
  const parts = value
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length > 1) {
    return parts.join(', ');
  }
  return value.trim();
}

function normalizeCommaDelimitedValue(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/,(?!\s)/g, ', ');
}

function hasCoverUrl(value: unknown): value is DoubanCoverValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'url' in value &&
    typeof value.url === 'string'
  );
}

function getDoubanPlatformLinks() {
  const platformContainer = findElement({
    selector: '#content .game-attr',
    subSelector: 'dt',
    sibling: true,
    keyWord: '平台',
  });
  if (!platformContainer) {
    return [];
  }
  return Array.from(platformContainer.querySelectorAll<HTMLAnchorElement>('a'));
}

function getDoubanDescriptionInfos() {
  const result: SingleInfo[] = [];
  const inputList = document.querySelectorAll<HTMLInputElement>(
    'input[name="target"][type="hidden"]'
  );
  inputList.forEach(($input) => {
    if ($input.value !== 'description') {
      return;
    }
    const $target = $input
      .closest('form')
      ?.querySelector<HTMLInputElement>('.desc-form-item #thing_desc_options_0');
    if ($target) {
      result.push({
        name: '游戏简介',
        value: $target.value,
        category: 'subject_summary',
      });
    }
  });
  return result;
}

function getDoubanMusicFieldValue($field: HTMLElement) {
  const anchors = Array.from($field.querySelectorAll<HTMLAnchorElement>('a'));
  if (anchors.length) {
    return anchors
      .map((anchor) => anchor.textContent?.trim() ?? '')
      .filter(Boolean)
      .join('、');
  }
  const nextNode = $field.nextSibling;
  if (nextNode?.nodeType === Node.TEXT_NODE) {
    return nextNode.textContent?.trim() ?? '';
  }
  return '';
}

function getDoubanMusicTracks(): DoubanTrack[] {
  const durationReg = /\s*\d{1,2}:\d{1,2}$/;
  return Array.from(
    document.querySelectorAll<HTMLLIElement>('.track-list ul.track-items > li')
  )
    .map((item) => {
      const order = Number.parseInt(item.getAttribute('data-track-order') ?? '0', 10);
      const titleRaw = item.textContent?.trim() ?? '';
      const durationMatch = titleRaw.match(durationReg);
      if (durationMatch) {
        return {
          title: titleRaw.replace(durationReg, '').trim(),
          duration: durationMatch[0].trim(),
          order: Number.isNaN(order) ? 0 : order,
        };
      }
      return {
        title: titleRaw,
        order: Number.isNaN(order) ? 0 : order,
      };
    })
    .filter((track) => track.title);
}

function groupDoubanTracksByDisc(tracks: DoubanTrack[]) {
  const discList: DoubanTrack[][] = [];
  let currentDisc: DoubanTrack[] = [];
  for (const track of tracks) {
    if (track.order === 0) {
      if (currentDisc.length) {
        discList.push(currentDisc);
        currentDisc = [];
      }
      continue;
    }
    currentDisc.push(track);
  }
  if (currentDisc.length) {
    discList.push(currentDisc);
  }
  return discList;
}

export const doubanTools: SiteTools = {
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
    async afterGetWikiData(infos: SingleInfo[]) {
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
          value: getText(link).replace(/\/.*/, '').trim(),
          category: 'platform',
        });
      }
      return result;
    },
  },
  filters: [],
};

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
