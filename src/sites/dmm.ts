import { SingleInfo } from '../interface/subject';
import { CharaModel } from '../interface/wiki';
import { getImageDataByURL } from '../utils/dealImage';
import { $qa } from '../utils/domUtils';
import { dealDate } from '../utils/utils';
import { getWikiItem } from './common';
import { charaInfoDict } from './lib';
import { SiteTools } from './types';

export const dmmTools: SiteTools = {
  hooks: {
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      const hasCover = infos.some((info) => info.category == 'cover');
      for (const info of infos) {
        let val = info.value;
        res.push({
          ...info,
          value: val,
        });
      }
      if (!hasCover) {
        // 使用 slider 里面的第一个图片
        const slides = $qa('.image-slider.slick-slider li.slick-slide');
        if (slides) {
          let url;
          let dataUrl = '';
          const targetSlide = Array.from(slides).find(
            (slide) => (slide as HTMLElement).dataset.slickIndex === '0'
          );
          url = targetSlide.querySelector('img')?.getAttribute('src');
          if (url) {
            try {
              dataUrl = await getImageDataByURL(url);
            } catch (error) {
              dataUrl = url;
            }
            res.push({
              name: 'cover',
              category: 'cover',
              value: {
                url,
                dataUrl,
              },
            });
          }
        } else {
          const coverInfo = await getWikiItem(
            {
              name: 'cover',
              selector: [
                {
                  selector: '#if_view',
                  isIframe: true,
                  subSelector: 'body',
                  nextSelector: {
                    selector: '#guide-head > img',
                  },
                },
              ],
              category: 'cover',
            },
            'dmm_game'
          );
          coverInfo && res.push(coverInfo);
        }
      }
      return res;
    },
  },
  filters: [
    {
      category: 'date',
      dealFunc(str: string) {
        const re = /\d{4}\/\d{1,2}(\/\d{1,2})?/;
        const m = str.match(re);
        if (m) {
          return dealDate(m[0]);
        }
        return str;
      },
    },
  ],
};

export const dmmCharaTools: SiteTools = {
  hooks: {
    async afterGetWikiData(
      infos: SingleInfo[],
      model: CharaModel,
      $el: Element
    ) {
      const res: SingleInfo[] = [...infos];
      const $nameTxt = $el.querySelector(
        '.guide-tx16.guide-bold.guide-lin-hgt'
      );
      if ($nameTxt) {
        // （きのみや なのか）
        const nameTxt = $nameTxt.textContent;
        if (nameTxt.match(/（(.*)）/)) {
          res.push({
            name: '纯假名',
            value: nameTxt.match(/（(.*)）/)[1],
          });
        }
        const cvTxt = $nameTxt.nextSibling.textContent;
        if (/CV/.test(cvTxt)) {
          res.push({
            name: 'CV',
            value: cvTxt.replace(/CV：/, '').replace(/\s/g, ''),
          });
        }
      }
      const boxArr = Array.from($el.querySelectorAll('.box'));
      for (const $box of boxArr) {
        const txtArr = $box.textContent
          .trim()
          .split(/：|:/)
          .map((s) => s.trim());
        if (charaInfoDict[txtArr[0]]) {
          res.push({
            name: charaInfoDict[txtArr[0]],
            value: txtArr[1],
          });
        } else {
          res.push({
            name: txtArr[0],
            value: txtArr[1],
          });
        }
      }
      const $summary = $nameTxt.closest('div').cloneNode(true) as Element;
      $summary.firstElementChild.remove();
      res.push({
        name: '人物简介',
        value: $summary.textContent,
        category: 'crt_summary',
      });
      return res;
    },
  },
};
