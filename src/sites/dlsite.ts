import { SingleInfo } from '../interface/subject';
import { CharaModel } from '../interface/wiki';
import { getImageDataByURL } from '../utils/dealImage';
import { dealDate } from '../utils/utils';
import { SiteTools } from './types';

export const dlsiteTools: SiteTools = {
  hooks: {
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let val = info.value;
        if (
          val &&
          typeof val === 'string' &&
          !/http/.test(val) &&
          ['原画', '剧本', '音乐', '游戏类型', '声优', '作者'].includes(info.name)
        ) {
          const v = info.value.split('/');
          if (v && v.length > 1) {
            val = v.map((s: string) => s.trim()).join(', ');
          }
        }
        res.push({
          ...info,
          value: val,
        });
      }
      if (location.hostname.includes('dlsite.com')) {
        res.push({
          name: 'website',
          value: `DLsite|${location.origin + location.pathname}`,
          category: 'listItem',
        })
      }
      const cover = infos.find((obj) => obj.name === 'cover');
      if (!cover) {
        let url = (
          document.querySelector('meta[property="og:image"]') as HTMLMetaElement
        )?.content;
        if (url) {
          let dataUrl = url;
          try {
            if (url) {
              dataUrl = await getImageDataByURL(url, {
                headers: {
                  Referer: url,
                },
              });
            }
          } catch (error) {}
          res.push({
            category: 'cover',
            name: 'cover',
            value: {
              url,
              dataUrl,
            },
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
        if (/年/.test(str)) {
          return dealDate(str.replace(/日.+$/, '日'));
        }
        return str;
      },
    },
  ],
};

export const dlsiteCharaTools: SiteTools = {
  hooks: {
    async afterGetWikiData(
      infos: SingleInfo[],
      model: CharaModel,
      el: Element
    ) {
      const res: SingleInfo[] = [...infos];
      const txt = el.querySelector('p')?.textContent || '';
      res.push({
        name: '姓名',
        value: txt.split('\n')[0],
        category: 'crt_name',
      });
      res.push({
        name: 'CV',
        value: (txt.split('\n').find((s) => s.includes('CV')) || '')
          .replace('CV:', '')
          .trim(),
      });
      let idx = txt.indexOf('\n\n');
      if (idx === -1) {
        idx = 0;
      } else {
        idx = idx + 2;
      }
      res.push({
        name: '人物简介',
        value: txt.slice(idx),
        category: 'crt_summary',
      });
      return res;
    },
  },
};
