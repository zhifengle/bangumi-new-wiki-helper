import { getStringValue, SingleInfo } from '../../interface/subjectInfo';
import { getImageDataByURL } from '../../utils/dealImage';
import { SubjectTools } from '../catalogTypes';

export const vgmdbTools: SubjectTools = {
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

      // Clean up credits DOM before extraction:
      // 1. Remove reference markers: <span title="Referenced">*</span>
      // 2. Remove group affiliations: " (feel)" text nodes after <a> tags
      const credits = document.querySelector('#collapse_credits');
      if (credits) {
        credits
          .querySelectorAll('span[title="Referenced"]')
          .forEach((el) => el.remove());

        for (const td of credits.querySelectorAll('tr > td:nth-child(2)')) {
          for (const node of [...td.childNodes]) {
            if (node.nodeType === Node.TEXT_NODE) {
              node.textContent = node.textContent.replace(
                /\s*\([^)]*\)/g,
                ''
              );
            }
          }
        }
      }

      return true;
    },
    async finalize(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      const $h1 = document.querySelector('#innermain > h1') as HTMLElement;
      res.push({
        name: '唱片名',
        value: $h1.innerText,
        category: 'subject_title',
      });

      // Alternative titles as aliases
      const titleSpans = document.querySelectorAll('h1 span.albumtitle');
      const primaryText = $h1.innerText.trim();
      const seen = new Set([primaryText]);
      for (const span of titleSpans) {
        const text = (span as HTMLElement).textContent
          .replace(/^\s*\/\s*/, '')
          .trim();
        if (text && !seen.has(text)) {
          res.push({
            name: '别名',
            value: text,
            category: 'alias',
          });
          seen.add(text);
        }
      }

      for (const item of infos) {
        const stringValue = getStringValue(item.value);
        if (item.name === '价格' && stringValue.includes('Not for Sale')) {
          continue;
        }
        if (item.name === '版本特性' && /\d+/.test(stringValue)) {
          res.push({
            ...item,
            value: stringValue.replace(/\d+/, '').trim(),
          });
          continue;
        }
        if (item.name === '目录编号') {
          res.push({
            ...item,
            value: stringValue.trim().split(' ')[0].trim(),
          });
          continue;
        }
        res.push(item);
      }

      // Publisher (出版方) — only if different from Label
      const labelValue = infos.find((i) => i.name === '厂牌')?.value || '';
      const infoTable = document.querySelector('#rightfloat');
      if (infoTable) {
        for (const tr of infoTable.querySelectorAll('tr.maincred')) {
          const labelTd = tr.querySelector('td:first-child');
          if (labelTd && labelTd.textContent.trim() === 'Publisher') {
            const valueTd = tr.querySelector('td:nth-child(2)');
            if (valueTd) {
              const pubValue = (valueTd as HTMLElement).innerText.trim();
              if (pubValue && pubValue !== labelValue) {
                res.push({ name: '出版方', value: pubValue });
              }
            }
          }
        }
      }

      // Instruments — collect all matching credit rows
      const instrumentKeywords = /^(Guitars?|Electric Guitars?|Acoustic Guitars?|Bass|Electric Bass|Drums?|Percussion|Piano|Acoustic Piano|Keyboard|Keyboards|Synthesizer|Synth|Violin|Viola|Cello|Strings|Flute|Oboe|Trumpet|Saxophone|Harmonica|All Instruments|All Other Instruments|Instruments)$/i;
      const creditSection = document.querySelector('#collapse_credits table');
      if (creditSection) {
        const instrumentists: string[] = [];
        for (const tr of creditSection.querySelectorAll(
          'tr.maincred, tr.extracred'
        )) {
          const roleTd = tr.querySelector('td:first-child') as HTMLElement;
          if (!roleTd) continue;
          // Use the en span's title for role matching to avoid mixed-language textContent
          const enSpan = roleTd.querySelector(
            '.artistname[lang="en"]'
          ) as HTMLElement;
          const roleText = enSpan
            ? (enSpan.title || enSpan.textContent).trim()
            : roleTd.innerText.trim();
          if (instrumentKeywords.test(roleText)) {
            const valueTd = tr.querySelector(
              'td:nth-child(2)'
            ) as HTMLElement;
            if (valueTd) {
              const names = valueTd.innerText.trim();
              if (names) instrumentists.push(names);
            }
          }
        }
        if (instrumentists.length) {
          res.push({ name: '乐器', value: instrumentists.join('、') });
        }
      }

      // Disc count
      const tracklist = document.querySelector('#tracklist');
      if (tracklist) {
        const discHeaders = tracklist.querySelectorAll('.tl b');
        let discCount = 0;
        discHeaders.forEach((b) => {
          if (/^Disc\s+\d+$/i.test(b.textContent.trim())) discCount++;
        });
        if (discCount > 0) {
          res.push({ name: '碟片数量', value: String(discCount) });
        }
      }

      // VGMdb link
      const canonical = document.querySelector(
        'link[rel="canonical"]'
      ) as HTMLLinkElement;
      const vgmdbUrl = canonical?.href || location.href.replace(/\?.*$/, '');
      if (vgmdbUrl) {
        res.push({ name: '链接', value: vgmdbUrl, category: 'listItem' });
      }

      // Cover image
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

      // Tracklist (episodes)
      if (tracklist) {
        let tableList = tracklist.querySelectorAll('.tl > table');
        document.querySelectorAll('#tlnav > li > a')?.forEach((item) => {
          if (item.innerHTML.includes('Japanese')) {
            const rel = item.getAttribute('rel');
            tableList = document.querySelectorAll(`#${rel} > table`);
          }
        });
        const discArr = [...tableList].map((table) => {
          return [...table.querySelectorAll('tr')].map((item) => {
            const $tds = item.querySelectorAll('td');
            return {
              title: $tds[1].innerText.trim(),
              duration: $tds[2].innerText.trim(),
            };
          });
        });
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


