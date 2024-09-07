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
            auxSite: {
              url: (
                document.querySelector('.th-modify > a') as HTMLAnchorElement
              ).href,
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

export const doubanMusicTools: SiteTools = {
  hooks: {
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const item of infos) {
        res.push(item);
      }
      const $info = document.querySelector('#info');
      if ($info) {
        const nameDict: any = {
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
          }
        };
        $info.querySelectorAll('.pl').forEach((pl) => {
          let val = '';
          if (pl.nextSibling.TEXT_NODE === 3) {
            val = pl.nextSibling.textContent.trim();
          }
          let key = pl.textContent.trim().split(':')[0];
          const anchors = pl.querySelectorAll('a');
          if (anchors && anchors.length) {
            val = [...anchors].map((a) => a.textContent.trim()).join('、');
          }
          if (!val) {
            return;
          }
          if (key in nameDict) {
            const target = nameDict[key];
            res.push({
              ...target,
              value: val,
            });
          }
        });
      }
      const discNum = res.find((item) => item.name === '碟片数量')?.value || 1;
      const tracks = [
        ...document.querySelectorAll('.track-list ul.track-items > li'),
      ].map((item) => {
        const order = item.getAttribute('data-track-order');
        const orderNum = order ? parseInt(order) : 0;
        const titleRaw = item.textContent.trim();
        const durationReg = /\s*\d{1,2}:\d{1,2}$/;
        if (durationReg.test(titleRaw)) {
          const m = titleRaw.match(durationReg);
          return {
            title: titleRaw.replace(durationReg, ''),
            duration: m[0].trim(),
            order: orderNum,
          };
        }
        return {
          title: item.textContent.trim(),
          order: orderNum,
        };
      });
      const discArr: any[] = [];
      let curDisc: any[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track.order === 0) {
          if (curDisc.length) {
            discArr.push(curDisc);
            curDisc = [];
          }
          continue;
        }
        curDisc.push(track);
      }
      if (curDisc.length) {
        discArr.push(curDisc);
      }
      if (discArr.length && discArr.length == discNum) {
        res.push({
          category: 'ep',
          name: '',
          value: discArr,
        });
      } else {
        console.warn('碟片数量不匹配', discNum, discArr);
      }
      return res;
    },
  },
  filters: [],
};
