import { SiteTools } from './types';
import { SingleInfo } from '../interface/subject';
import { getImageDataByURL } from '../utils/dealImage';
import { findElement, getText } from '../utils/domUtils';

export const doubanTools: SiteTools = {
  hooks: {
    async beforeCreate() {
      const href = window.location.href;
      if (/\/game\//.test(href) && !/\/game\/\d+\/edit/.test(href)) {
        return {
          payload: {
            auxSite: (document.querySelector(
              '.th-modify > a'
            ) as HTMLAnchorElement).href,
            auxPrefs: {
              originNames: ['平台', '发行日期'],
              targetNames: 'all',
            },
          },
        };
      }
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        if (['平台', '别名'].includes(info.name)) {
          const pArr = info.value.split('/').map((i: string) => {
            return {
              ...info,
              value: i.trim(),
            };
          });
          res.push(...pArr);
        } else if (info.category === 'cover') {
          res.push({ ...info });
        } else {
          let val = info.value;
          if (val && typeof val === 'string') {
            const v = info.value.split('/');
            if (v && v.length > 1) {
              val = v.map((s: string) => s.trim()).join(', ');
            }
          }
          if (info.name === '游戏类型' && val) {
            val = val.replace('游戏, ', '').trim();
          }
          res.push({
            ...info,
            value: val,
          });
        }
      }
      // 特殊处理平台
      const $plateform = findElement({
        selector: '#content .game-attr',
        subSelector: 'dt',
        sibling: true,
        keyWord: '平台',
      });
      if ($plateform) {
        const aList: any = $plateform.querySelectorAll('a') || [];
        const arr = [];
        for (const $a of aList) {
          res.push({
            name: '平台',
            value: getText($a).replace(/\/.*/, '').trim(),
            category: 'platform',
          });
        }
      }
      return res;
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
      const res: SingleInfo[] = [];
      for (const info of infos) {
        const arr: SingleInfo = { ...info };
        if (['平台', '别名'].includes(info.name)) {
          const plateformDict: any = {
            ARC: 'Arcade',
            NES: 'FC',
            红白机: 'FC',
            街机: 'Arcade',
          };
          const pArr = info.value.split(',').map((i: string) => {
            let v = i.trim();
            if (plateformDict[v]) {
              v = plateformDict[v];
            }
            return {
              ...info,
              value: v,
            };
          });
          res.push(...pArr);
        } else if (arr.category === 'cover' && arr.value && arr.value.url) {
          try {
            const url = arr.value.url.replace('/spic/', '/lpic/');
            const dataUrl = await getImageDataByURL(url);
            const coverItem = {
              ...arr,
              value: {
                dataUrl,
                url,
              },
            };
            res.push(coverItem);
          } catch (error) {
            console.error(error);
          }
        } else if (arr.name === '游戏类型') {
          arr.value = arr.value.replace(/,(?!\s)/g, ', ');
          res.push(arr);
        } else if (arr.name === '开发') {
          arr.value = arr.value.replace(/,(?!\s)/g, ', ');
          res.push(arr);
        } else {
          res.push(arr);
        }
      }
      // 描述
      const inputList = document.querySelectorAll(
        'input[name="target"][type="hidden"]'
      );
      inputList.forEach(($input: HTMLInputElement) => {
        const val = $input.value;
        if (val === 'description') {
          const $target = $input
            .closest('form')
            .querySelector(
              '.desc-form-item #thing_desc_options_0'
            ) as HTMLInputElement;
          if ($target) {
            res.push({
              name: '游戏简介',
              value: $target.value,
              category: 'subject_summary',
            });
          }
        }
      });
      return res;
    },
  },
  filters: [],
};
