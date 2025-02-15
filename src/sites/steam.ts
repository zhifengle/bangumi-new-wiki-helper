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
        if (info.name === '游戏简介') {
          if (info.value.match(/\n.*?Steam charts, data, update history\.$/)) {
            newInfo.value = info.value.split('\n')[0];
          }
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
          const names = [...sibling.querySelectorAll('table > tbody > tr')].map((tr) => {
            const name = tr.querySelector('td:nth-child(1)').textContent.trim();
            const value = tr.querySelector('td:nth-child(2)').textContent.trim();
            return {
              name,
              value,
            }
          })
          const gameName = res.find(info => info.name === '游戏名');
          const enName = names.find(name => name.name === 'english');
          const jpName = names.find(name => name.name === 'japanese');
          if (enName && gameName) {
            if (gameName.value !== enName.value) {
              res.push({
                name: '别名',
                value: `英文|${enName.value}`,
              })
            }
          }
          if (jpName && gameName) {
            if (gameName.value !== jpName.value) {
              res.push({
                name: '别名',
                value: `日文|${jpName.value}`,
              })
            }
          }
          const tchName = names.find(name => name.name === 'tchinese');
          if (tchName) {
            res.push({
              name: '别名',
              value: `繁中|${tchName.value}`,
            })
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
