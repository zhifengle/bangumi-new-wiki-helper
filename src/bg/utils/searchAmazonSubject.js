import { gmFetchBinary, gmFetch } from './gmFetch';
import { getImageDataByURL } from './getImageBase64';

function toQueryStr(obj) {
  let s = '';
  Object.keys(obj).forEach((k, i) => {
    if (obj[k]) {
      if (i === 0) {
        s += `${k}=${obj[k]}`;
      } else {
        s += `&${k}=${obj[k]}`;
      }
    }
  });
  return s;
}


async function searchAmazonSubject(q, page = 1) {
  /*
   * const query = {
   *   // sf: 'qz',
   *   node: 465392,
   *   // ie: 'UTF8',
   *   keywords: encodeURIComponent(q),
   *   // tag: 'alhsabc-20',
   *   // unfiltered: 1,
   *   page: page,
   * };
   * const SITE_URL = 'https://www.amazon.co.jp';
   * const BASE_URL = `${SITE_URL}/s/ref=sr_qz_back?${toQueryStr(query)}`;
   */
  // const SITE_URL = 'https://www.amazon.co.jp/s/ref=sr_fapo/ref=search_black_curtain_yes?_encoding=UTF8&fap=1&ie=UTF8&'
  const BASE_URL = `https://www.amazon.co.jp/s/ref=nb_sb_noss?url=search-alias%3Dstripbooks&field-keywords=${encodeURIComponent(q)}`;
  console.log('Amazon query URL: ', BASE_URL);
  let d = await gmFetch(BASE_URL);
  let $doc = (new DOMParser()).parseFromString(d, "text/html");
  return [...$doc.querySelectorAll('#s-results-list-atf li')].map(async (elem) => await getItemInfo(elem));
}

async function getItemInfo($li) {
  if (!$li || !/result/.test($li.getAttribute('id'))) return;
  let cover = $li.querySelector('img.s-access-image');
  let coverURL = '';
  if (cover) {
    coverURL = cover.getAttribute('src');
  }
  let $mini = $li.querySelector('.a-spacing-mini');
  if ($mini) {
    let href = $mini.querySelector('a.s-access-detail-page').getAttribute('href');
    let title = $mini.querySelector('h2').innerText.trim();
    let info = $mini.innerText.trim().replace('title', '');
    let base64Data = await getImageDataByURL(coverURL);
    return {
      href,
      title,
      info,
      base64Data
    };
  }
}

export default searchAmazonSubject;
