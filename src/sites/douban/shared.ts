import { SingleInfo } from '../../interface/subjectInfo';

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

export const DOUBAN_GAME_PLATFORM_MAP: Record<string, string> = {
  ARC: 'Arcade',
  NES: 'FC',
  红白机: 'FC',
  街机: 'Arcade',
};

export const DOUBAN_MUSIC_FIELD_MAP: Record<string, DoubanMusicField> = {
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

export function getDoubanModifyUrl() {
  return document.querySelector<HTMLAnchorElement>('.th-modify > a')?.href;
}

export function splitInfoValues(
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

export function normalizeSlashDelimitedValue(value: unknown) {
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

export function normalizeCommaDelimitedValue(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/,(?!\s)/g, ', ');
}

export function hasCoverUrl(value: unknown): value is DoubanCoverValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'url' in value &&
    typeof value.url === 'string'
  );
}

export function getDoubanPlatformLinks() {
  const platformContainer = Array.from(
    document.querySelectorAll<HTMLElement>('#content .game-attr dt')
  ).find((element) => element.textContent?.includes('平台'))?.nextElementSibling;
  if (!platformContainer) {
    return [];
  }
  return Array.from(platformContainer.querySelectorAll<HTMLAnchorElement>('a'));
}

export function getDoubanDescriptionInfos() {
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

export function getDoubanMusicFieldValue($field: HTMLElement) {
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

export function getDoubanMusicTracks(): DoubanTrack[] {
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

export function groupDoubanTracksByDisc(tracks: DoubanTrack[]) {
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

