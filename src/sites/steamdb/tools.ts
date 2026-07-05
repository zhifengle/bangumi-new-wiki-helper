import { getCoverValue, getStringValue, SingleInfo } from '../../interface/subjectInfo';
import { getImageDataByURL } from '../../utils/dealImage';
import { formatDate } from '../../utils/utils';
import { SubjectTools } from '../catalogTypes';

export const steamdbTools: SubjectTools = {
  hooks: {
    async beforeCreate() {
      return {
        payload: {
          disableDate: true,
        },
      };
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let newInfo: null | SingleInfo = { ...info };
        const stringValue = getStringValue(info.value);
        if (info.name === '游戏引擎') {
          newInfo.value = stringValue.replace(/^Engine\./g, '');
        }
        if (info.name === '游戏简介') {
          if (stringValue.match(/\n.*?Steam charts, data, update history\.$/)) {
            newInfo.value = stringValue.split('\n')[0];
          }
        }
        if (info.name === 'cover') {
          const coverValue = getCoverValue(info.value);
          if (coverValue?.url) {
            const a = coverValue.url;
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
      const appId = $appInstall?.href.match(/steam:\/\/(?:install|launch)\/(\d+)/)?.[1];
      if (appId) {
        res.push({
          name: '链接',
          value: `Steam|https://store.steampowered.com/app/${appId}`,
          category: 'listItem',
        });
      }
      [...document.querySelectorAll('#info > table > tbody > tr > td.span3')].forEach(
        (item) => {
          const sibling = item.nextElementSibling as HTMLElement;
          if (sibling.innerHTML.includes('General Mature Content')) {
            res.push({
              name: 'subject_nsfw',
              value: '1',
              category: 'checkbox',
            });
            return;
          }
          if (item.innerHTML.includes('name_localized')) {
            const names = [...sibling.querySelectorAll('table > tbody > tr')].map((tr) => {
              const name = tr.querySelector('td:nth-child(1)').textContent.trim();
              const value = tr.querySelector('td:nth-child(2)').textContent.trim();
              return {
                name,
                value,
              };
            });
            const gameName = res.find((info) => info.name === '游戏名');
            const enName = names.find((name) => name.name === 'english');
            const jpName = names.find((name) => name.name === 'japanese');
            if (enName && gameName) {
              if (getStringValue(gameName.value) !== enName.value) {
                res.push({
                  name: '别名',
                  value: `英文|${enName.value}`,
                });
              }
            }
            if (jpName && gameName) {
              if (getStringValue(gameName.value) !== jpName.value) {
                res.push({
                  name: '别名',
                  value: `日文|${jpName.value}`,
                });
              }
            }
            const tchName = names.find((name) => name.name === 'tchinese');
            if (tchName) {
              res.push({
                name: '别名',
                value: `繁中|${tchName.value}`,
              });
            }
          }
        }
      );
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


