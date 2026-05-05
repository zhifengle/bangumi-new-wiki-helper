import { getStringValue, SingleInfo } from '../../interface/subjectInfo';
import { SubjectTools } from '../catalogTypes';
import { getAmazonCoverInfo } from '../amazon/shared';

export const amazonJpMusicTools: SubjectTools = {
  hooks: {
    async finalize(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const item of infos) {
        if (item.name === '艺术家') {
          item.value = getStringValue(item.value).replace(/\//g, '、');
        }
        res.push(item);
      }
      const date = document.querySelector('#declarative_ .title-text > span');
      if (date) {
        const m = date.innerHTML.trim().match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
        if (m) {
          res.push({
            name: '发售日期',
            value: `${m[1]}-${m[2]}-${m[3]}`,
          });
        }
      }
      const coverInfo = await getAmazonCoverInfo(res);
      if (coverInfo) {
        res.push(coverInfo);
      }
      const $tracks = document.querySelector('#music-tracks');
      if ($tracks) {
        const discArr = [...$tracks.querySelectorAll('h4 + .a-row table')].map(
          (table) => {
            return [...table.querySelectorAll('tr > td:nth-child(2)')].map(
              (td) => {
                return {
                  title: td.innerHTML.trim(),
                };
              }
            );
          }
        );
        res.push({
          category: 'ep',
          name: '',
          value: discArr,
        });
      }
      return res;
    },
  },
};


