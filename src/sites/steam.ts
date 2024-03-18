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
          auxSite: {
            url: getSteamdbURL(window.location.href),
          },
        },
      };
    },
  },
  filters: [
    {
      category: 'website',
      dealFunc(str: string) {
        // https://steamcommunity.com/linkfilter/?url=https://www.koeitecmoamerica.com/ryza/
        const arr = str.split('?url=');
        return arr[1] || '';
      },
    },
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
          auxSite: {
            url: getSteamURL(window.location.href),
          },
        },
      };
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let newInfo: null | SingleInfo = { ...info };
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
