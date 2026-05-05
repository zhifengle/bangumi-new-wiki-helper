import { SingleInfo } from '../../interface/subjectInfo';
import { getImageDataByURL } from '../../utils/dealImage';
import { CharacterTools, SubjectTools } from '../catalogTypes';

export const dlsiteTools: SubjectTools = {
  hooks: {
    async finalize(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        res.push({
          ...info,
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
};

export const dlsiteCharaTools: CharacterTools = {
  hooks: {
    async finalize(
      infos: SingleInfo[],
      context
    ) {
      const el = context.kind === 'character' ? context.root : undefined;
      if (!el || !('querySelector' in el)) return infos;
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



