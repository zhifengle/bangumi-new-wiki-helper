import { SiteTools } from './types';
import { SingleInfo } from '../interface/subject';
import { getImageDataByURL } from '../utils/dealImage';

export const doubanTools: SiteTools = {
  hooks: {
    async beforeCreate() {
      const href = window.location.href;
      return /\/game\//.test(href) && !/\/game\/\d+\/edit/.test(href);
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      infos.forEach((info) => {
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
              val = v.map((s: string) => s.trim()).join(',');
            }
          }
          res.push({
            ...info,
            value: val,
          });
        }
      });
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
      infos.forEach(async (info) => {
        const arr: SingleInfo = { ...info };
        if (arr.category === 'cover' && arr.value && arr.value.url) {
          try {
            console.info('fetch lpic', arr.value);
            arr.value.dataUrl = await getImageDataByURL(
              arr.value.url.replace('/spic/', '/lpic/')
            );
          } catch (error) {}
        }
        res.push(arr);
      });
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
