import { SingleInfo } from '../interface/subject';
import { getImageDataByURL } from '../utils/dealImage';
import { $qa } from '../utils/domUtils';
import { dealDate } from '../utils/utils';
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
