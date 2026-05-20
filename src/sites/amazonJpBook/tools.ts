import { getStringValue, SingleInfo } from '../../interface/subjectInfo';
import { SubjectTools } from '../catalogTypes';
import { amazonUtils, getAmazonCoverInfo } from '../amazon/shared';

export { amazonUtils } from '../amazon/shared';

const usedOfferReg = /非全新品|中古品|中古商品|コレクター商品|收藏品/i;
const currentUsedBuyboxReg =
  /中古品\s*[:：]|中古商品\s*[:：]|コンディション\s*[:：]?\s*(?:中古|非全新品)|コレクター商品\s*[:：]|非全新品\s*[:：]/i;
const newOfferReg = /新品/i;
const kindleFormatReg = /Kindle|電子書籍|电子书/i;

function getText(selector: string) {
  return document.querySelector(selector)?.textContent ?? '';
}

function isCurrentAmazonJpBookOfferUsed() {
  const selectedFormatText = getText('#tmmSwatches .a-button-selected');
  if (kindleFormatReg.test(selectedFormatText)) {
    return false;
  }

  const currentBuyboxText = getText(
    '#usedOnlyBuybox, #used_buybox_desktop, #usedBuySection, #desktop_buybox'
  );
  if (
    document.querySelector(
      '#usedOnlyBuybox, #used_buybox_desktop, #usedBuySection, #usedOfferListingID'
    ) ||
    currentUsedBuyboxReg.test(currentBuyboxText)
  ) {
    return true;
  }

  const otherOfferText = getText('.aod-popover-caret-link');
  return usedOfferReg.test(otherOfferText) && !newOfferReg.test(otherOfferText);
}

function getBookFormatSwatches() {
  const $swatches = document.querySelector('#tmmSwatches');
  if (!$swatches) {
    return [];
  }

  const formatSwatches = $swatches.querySelectorAll('[id^="tmm-grid-swatch-"]');
  if (formatSwatches.length) {
    return Array.from(formatSwatches);
  }

  return Array.from($swatches.querySelectorAll('.swatchElement'));
}

function getTitleAnchor() {
  const $title = document.querySelector('#title');
  if ($title) {
    return $title;
  }
  const $productTitle = document.querySelector('#productTitle');
  return $productTitle?.closest('h1') ?? $productTitle;
}

export const amazonJpBookTools: SubjectTools = {
  filters: [
    {
      category: 'subject_title',
      dealFunc: amazonUtils.dealTitle,
    },
  ],
  hooks: {
    async beforeCreate() {
      const $t = getTitleAnchor();
      const formatSwatches = getBookFormatSwatches();
      if (
        $t &&
        !document.querySelector('.e-wiki-amazon-book-format-warning') &&
        formatSwatches.length > 1
      ) {
        const $div = document.createElement('div');
        $div.className = 'e-wiki-amazon-book-format-warning';
        const $s = document.createElement('span');
        $s.style.color = 'red';
        $s.style.fontWeight = '600';
        $s.innerHTML = '注意: ';
        const $txt = document.createElement('span');
        $txt.innerHTML =
          '书籍存在多种版本，请优先选择实体书创建。(辅助创建脚本)';
        $div.appendChild($s);
        $div.appendChild($txt);
        $div.style.padding = '6px 0';
        $t.insertAdjacentElement('afterend', $div);
      }
      return true;
    },
    async afterGetWikiData(infos: SingleInfo[]) {
      const res: SingleInfo[] = [];
      for (const info of infos) {
        let newInfo: null | SingleInfo = { ...info };
        const stringValue = getStringValue(info.value);
        if (info.name === '页数') {
          const val = stringValue.trim().replace(/ページ|页/, '');
          if (val && val.length < 8 && val.indexOf('予約商品') === -1) {
            newInfo.value = val;
          } else {
            newInfo = null;
          }
        } else if (info.name === '播放时长') {
          newInfo.value = stringValue.replace('時間', '小时').replace(/ /g, '');
        } else if (info.name === '价格') {
          newInfo.value = stringValue.replace(/来自|より/, '').trim();
          if (isCurrentAmazonJpBookOfferUsed()) {
            newInfo = null;
          }
        }
        if (newInfo) {
          res.push({
            ...newInfo,
          });
        }
      }
      const coverInfo = await getAmazonCoverInfo(res);
      if (coverInfo) {
        res.push(coverInfo);
      }
      return res;
    },
  },
};
