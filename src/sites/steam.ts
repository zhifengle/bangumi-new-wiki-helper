import { SiteTools } from './types';
import { dealDate, formatDate } from '../utils/utils';

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
          return dealDate(str);
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
