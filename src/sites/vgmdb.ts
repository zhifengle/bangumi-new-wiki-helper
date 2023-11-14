import { SingleInfo } from '../interface/subject';
import { getImageDataByURL } from '../utils/dealImage';
import { SiteTools } from './types';

export const vgmdbTools: SiteTools = {
  hooks: {
    async beforeCreate() {
      const $t = document.querySelector(
        '#innermain h1 > .albumtitle[lang=ja]'
      ) as HTMLElement;
      if ($t && $t.style.display === 'none') {
        const $div = document.createElement('div');
        const $s = document.createElement('span');
        $s.style.color = 'red';
        $s.style.fontWeight = '600';
        $s.innerHTML = '注意: ';
        const $txt = document.createElement('span');
        $txt.innerHTML =
          '请设置 Title / Name Language 为 Original。(辅助创建脚本)';
        $div.appendChild($s);
        $div.appendChild($txt);
        $div.style.padding = '6px 0';
        $t.parentElement.insertAdjacentElement('afterend', $div);
      }
      return true;
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      const $h1 = document.querySelector('#innermain > h1') as HTMLElement;
      res.push({
        name: '唱片名',
        value: $h1.innerText,
        category: 'subject_title',
      });
      for (const item of infos) {
        if (item.name === '价格' && item.value.includes('Not for Sale')) {
          continue;
        }
        res.push(item);
      }

      /*
      for (const $td of document.querySelectorAll(
        '#album_infobit_large td:first-child'
      )) {
        const label = ($td as HTMLElement).innerText;
        const links = $td.nextElementSibling.querySelectorAll('a');
        let value = '';
        if ($td.nextElementSibling.querySelector('.artistname[lang=ja]')) {
          value = [...links]
            .map(
              (node) => node.querySelector('.artistname[lang=ja]').textContent
            )
            .join('、');
        } else {
          value = [...links].map((node) => node.innerText).join('、');
        }
        let name = '';
        if (label.includes('Performer')) {
          name = '艺术家';
        } else if (label.includes('Composer')) {
          name = '作曲';
        } else if (label.includes('Arranger')) {
          name = '编曲';
        } else if (label.includes('Lyricist')) {
          name = '作词';
        }
        if (name) {
          res.push({
            name,
            value,
          });
        }
      }
      */
      let url = (
        document.querySelector('meta[property="og:image"]') as HTMLMetaElement
      )?.content;
      if (!url) {
        try {
          url = (
            document.querySelector('#coverart') as HTMLElement
          ).style.backgroundImage.match(/url\(["']?([^"']*)["']?\)/)[1];
        } catch (error) {}
      }
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
      return res;
    },
  },
};
