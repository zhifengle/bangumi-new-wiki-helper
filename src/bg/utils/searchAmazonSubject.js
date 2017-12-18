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
  const query = {
    sf: 'qz',
    keywords: encodeURIComponent(q),
    node: 465392,
    ie: 'UTF8',
    tag: 'alhsabc-20',
    unfiltered: 1,
    page: page,
  };
  const SITE_URL = 'https://www.amazon.co.jp';
  const BASE_URL = `${SITE_URL}/s/ref=sr_qz_back?${toQueryStr(query)}`;
  let d = await gmFetch(BASE_URL);
  let $doc = (new DOMParser()).parseFromString(d, "text/html");
  return [...$doc.querySelectorAll('#s-results-list-atf li')].map(async (elem) => await getItemInfo(elem));
}
/*
 *
 *   <h3>
 *   <span class="ico_subject_type subject_type_1 ll"></span>
 *   <a  target="_blank" href="${href}" class="l">${title}</a>
 *   </h3>
 */
async function getItemInfo($li) {
  let coverURL = $li.querySelector('img.s-access-image').getAttribute('src');
  let $mini = $li.querySelector('.a-spacing-mini');
  let href = $mini.querySelector('a.s-access-detail-page').getAttribute('href');
  let title = $mini.querySelector('h2').innerText.trim();
  let info = $mini.innerText.trim().replace('title', '');
  let base64Data = await getImageDataByURL(coverURL);
  return {
    href,
    title,
    info,
    base64Data
  }
}

export default searchAmazonSubject;
