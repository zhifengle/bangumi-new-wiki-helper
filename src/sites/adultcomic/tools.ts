import { SingleInfo } from '../../interface/subjectInfo';
import { SubjectTools } from '../catalogTypes';

export const adultComicTools: SubjectTools = {
  hooks: {
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let newInfo: null | SingleInfo = { ...info };
        if (info.name === '作者') {
          const lists = document.querySelectorAll(
            '#info-table > div.info-box .author-list > li'
          );
          if (lists && lists.length > 1) {
            newInfo.value = Array.from(lists)
              .map((node) => node.textContent.trim())
              .join(', ');
          }
        }
        if (newInfo) {
          res.push({
            ...newInfo,
          });
        }
      }
      // getCover 判断 data-src。这里就禁用了
      // const $img = document.querySelector('#sample-image > figure > img');
      // if ($img) {
      //   const info: SingleInfo = {
      //     category: 'cover',
      //     name: 'cover',
      //     value: {
      //       url: $img.getAttribute('data-src'),
      //       dataUrl: $img.getAttribute('data-src'),
      //     },
      //   };
      //   res.push(info);
      // }
      return res;
    },
  },
};


