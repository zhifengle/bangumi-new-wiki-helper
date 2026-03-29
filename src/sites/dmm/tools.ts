import { SingleInfo } from '../../interface/subjectInfo';
import { CharacterSourceDefinition } from '../../interface/wiki';
import { getImageDataByURL } from '../../utils/dealImage';
import { $qa, getInnerText } from '../../utils/domUtils';
import { dealDate } from '../../utils/utils';
import { CharacterTools, SubjectTools } from '../catalogTypes';

function normalizeDmmCharacterName(name: string): string {
  return name.replace(/※.*$/, '').trim();
}

const dmmNoticeKeywordRe =
  /更新内容|パッチ|配布中|修正|適用|ダウンロード|バージョン|ver\.?\d|体験版・無料ダウンロード|公式サイト|こちらの商品はVer|update|patch|download|version|apply|fix|notice|※/i;

function looksLikeDmmNoticeBlock(block: string): boolean {
  const head = block.trim().slice(0, 300);
  return /^\d{4}\/\d{1,2}\/\d{1,2}/.test(head) || dmmNoticeKeywordRe.test(head);
}

function isSummaryDividerLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.length >= 6 && /^[^\p{L}\p{N}]+$/u.test(trimmed);
}

function splitSummaryBlocks(summary: string): string[] {
  const blocks: string[] = [];
  let current: string[] = [];

  const flush = () => {
    const block = current.join('\n').trim();
    if (block) {
      blocks.push(block);
    }
    current = [];
  };

  for (const line of summary.split('\n')) {
    if (isSummaryDividerLine(line)) {
      flush();
      continue;
    }
    current.push(line);
  }
  flush();

  return blocks;
}

function cleanupDmmSubjectSummary(summary: string): string {
  const normalized = summary.trim();
  const head = normalized.slice(0, 300);
  if (!looksLikeDmmNoticeBlock(head)) {
    return normalized;
  }

  const parts = splitSummaryBlocks(normalized);
  if (parts.length <= 1) {
    return normalized;
  }
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (!looksLikeDmmNoticeBlock(parts[i])) {
      return parts[i];
    }
  }
  return normalized;
}

function getDmmCharacterNameElement($el: Element): HTMLElement | null {
  return $el.querySelector<HTMLElement>(
    '.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt'
  );
}

function getDmmCharacterSummary($el: Element): string {
  return Array.from(
    $el.querySelectorAll<HTMLElement>('.detailGuide__box-date p')
  )
    .filter(($p) => !$p.querySelector('.detailGuide__tx16.detailGuide__bold.detailGuide__lin-hgt'))
    .map(($p) => getInnerText($p).trim())
    .filter(Boolean)
    .join('\n');
}

export const dmmTools: SubjectTools = {
  hooks: {
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      const hasCover = infos.some((info) => info.category == 'cover');
      for (const info of infos) {
        let val = info.value;
        if (info.category === 'subject_summary' && typeof val === 'string') {
          val = cleanupDmmSubjectSummary(val);
        }
        res.push({
          ...info,
          value: val,
        });
      }
      if (!hasCover) {
        // 使用 slider 里面的第一个图片。slick 初始化前，页面上也会先有静态 li。
        const slides = Array.from($qa<HTMLLIElement>('.image-slider li'));
        if (slides.length) {
          let url = '';
          let dataUrl = '';
          const targetSlide =
            slides.find((slide) => slide.dataset.slickIndex === '0') || slides[0];
          url = targetSlide.querySelector('img')?.getAttribute('src') || '';
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

export const dmmCharaTools: CharacterTools = {
  hooks: {
    async afterGetWikiData(
      infos: SingleInfo[],
      model: CharacterSourceDefinition,
      $el: Element
    ) {
      const res: SingleInfo[] = infos.map((info) => {
        if (info.category === 'crt_name' && typeof info.value === 'string') {
          return {
            ...info,
            value: normalizeDmmCharacterName(info.value),
          };
        }
        return info;
      });
      const $nameTxt = getDmmCharacterNameElement($el);
      if ($nameTxt) {
        // （きのみや なのか）
        const nameTxt = $nameTxt.textContent?.trim() || '';
        const kanaMatch = nameTxt.match(/（(.*)）/);
        if (kanaMatch) {
          res.push({
            name: '纯假名',
            value: kanaMatch[1],
          });
        }
        const cvSource =
          $nameTxt.parentElement?.textContent?.replace(nameTxt, '') || '';
        const cvMatch = cvSource.match(/CV[：:]\s*([^\n\r]+)/);
        if (cvMatch) {
          res.push({
            name: 'CV',
            value: cvMatch[1].replace(/\s/g, ''),
          });
        }
      }
      const summary = getDmmCharacterSummary($el);
      if (summary) {
        res.push({
          name: '人物简介',
          value: summary,
          category: 'crt_summary',
        });
      }
      return res;
    },
  },
};



