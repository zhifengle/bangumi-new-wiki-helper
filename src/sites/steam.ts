import { SiteTools } from './types';
import { dealDate, formatDate } from '../utils/utils';
import { SingleInfo } from '../interface/subject';
import { getImageDataByURL } from '../utils/dealImage';

export function getSteamdbURL(href: string) {
  href = href || location?.href;
  const id = href.match(/store\.steampowered\.com\/app\/(\d+)\/?/)?.[1];
  if (id) {
    return `https://steamdb.info/app/${id}/info/`;
  }
  return '';
}

export function getSteamURL(href: string) {
  href = href || location?.href;
  const id = href.match(/steamdb\.info\/app\/(\d+)\/?/)?.[1];
  if (id) {
    return `https://store.steampowered.com/app/${id}/_/`;
  }
  return '';
}

export const steamTools: SiteTools = {
  hooks: {
    async beforeCreate() {
      return {
        payload: {
          disableDate: true,
          // auxSite: {
          //   url: getSteamdbURL(window.location.href),
          // },
        },
      };
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let newInfo: SingleInfo = { ...info };
        if (info.name === 'website') {
          // https://steamcommunity.com/linkfilter/?url=https://www.koeitecmoamerica.com/ryza/
          const arr = newInfo.value.split('?url=');
          newInfo.value = arr[1] || '';
          newInfo.category = 'website,listItem';
        }
        res.push({
          ...newInfo,
        });
      }
      if (location.hostname === 'store.steampowered.com') {
        res.push({
          name: 'website',
          value: `Steam|${location.origin + location.pathname}`,
          category: 'website,listItem',
        })
      }
      return res;
    }
  },
  filters: [
    {
      category: 'date',
      dealFunc(str: string) {
        if (/年/.test(str)) {
          return dealDate(str.replace(/\s/g, ''));
        }
        return formatDate(str);
      },
    },
  ],
};

export const steamdbTools: SiteTools = {
  hooks: {
    async beforeCreate() {
      return {
        payload: {
          disableDate: true,
          // auxSite: {
          //   url: getSteamURL(window.location.href),
          // },
        },
      };
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let newInfo: null | SingleInfo = { ...info };
        if (info.name === '游戏引擎') {
          newInfo.value = info.value.replace(/^Engine\./g, '');
        }
        // if (info.name === '游戏类型') {
        //   newInfo.value = info.value.split(',').map((s) => s.trim()).join('、');
        // }
        if (info.name === 'cover') {
          if (info.value.url) {
            const a = info.value.url;
            const h = a.lastIndexOf('?');
            const m = a.substring((h === -1 ? a.length : h) - 4);
            const scaleUrl = a.substring(0, a.length - m.length) + '_2x' + m;
            let dataUrl = '';
            try {
              dataUrl = await getImageDataByURL(scaleUrl);
            } catch (error) {}
            if (dataUrl) {
              newInfo.value = {
                url: scaleUrl,
                dataUrl,
              };
            }
          }
        }
        if (newInfo) {
          res.push({
            ...newInfo,
          });
        }
      }
      const $appInstall = document.querySelector('#js-app-install') as HTMLAnchorElement;
      const appId = $appInstall?.href.match(/steam:\/\/launch\/(\d+)/)?.[1];
      if (appId) {
        res.push({
          name: 'website',
          value: `Steam|https://store.steampowered.com/app/${appId}`,
          category: 'listItem',
        });
      }
      // 额外信息
      [...document.querySelectorAll('#info > table > tbody > tr > td.span3')].forEach(item => {
        const sibling = item.nextElementSibling
        if (sibling.innerHTML.includes('General Mature Content')) {
          res.push({
            name: 'subject_nsfw',
            value: '1',
            category: 'checkbox',
          });
          return
        }
        if (item.innerHTML.includes('name_localized')) {
          const tds = sibling.querySelectorAll('table > tbody > tr > td')
          for (const td of tds) {
            // 默认使用的中文名
            if (td.textContent === 'tchinese') {
              res.push({
                name: '别名',
                value: `繁中|${td.nextElementSibling.innerHTML.trim()}`,
              })
            }
            // 默认使用的日文名。补上英文名
            if (td.textContent === 'japanese') {
              const name = td.nextElementSibling.innerHTML.trim();
              const gameName = res.find(info => info.name === '游戏名');
              if (gameName && gameName.value === name) {
                const titleName = document.querySelector('.pagehead h1').textContent.trim();
                res.push({
                  name: '别名',
                  value: `英文|${titleName}`,
                })
              }
            }
          }
        }
      })
      return res;
    },
  },
  filters: [
    {
      category: 'date',
      dealFunc(str: string) {
        const arr = str.split('–');
        if (!arr[0]) return '';
        return formatDate(arr[0].trim());
      },
    },
  ],
};
