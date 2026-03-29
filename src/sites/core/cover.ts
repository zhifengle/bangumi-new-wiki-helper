import type { IFetchOpts } from '../../interface/types';
import type { SubjectModelKey } from '../../interface/wiki';
import { getImageDataByURL } from '../../utils/dealImage';
import type { WikiPageContext } from './context';

function getCurrentPageUrl() {
  return typeof location === 'undefined' ? '' : location.href;
}

export async function getCover(
  $d: Element,
  site: SubjectModelKey,
  context: WikiPageContext = {}
) {
  let url;
  let dataUrl = '';
  if ($d.tagName.toLowerCase() === 'a') {
    url = $d.getAttribute('href');
  } else if ($d.tagName.toLowerCase() === 'img') {
    url = $d.getAttribute('src');
    const dataSrc = $d.getAttribute('data-src');
    if (dataSrc) {
      url = dataSrc;
    }
  }
  if (!url) return;
  try {
    const currentPageUrl = getCurrentPageUrl();
    if (!/^https?:/.test(url) && (context.sourceUrl || currentPageUrl)) {
      url = new URL(url, context.sourceUrl || currentPageUrl).href;
    }
    // 跨域的图片不能用这种方式
    let opts: IFetchOpts = {};
    if (site.includes('getchu')) {
      const referer = context.imageReferer || currentPageUrl;
      opts.headers = referer
        ? {
            Referer: referer,
          }
        : undefined;
    }
    dataUrl = await getImageDataByURL(url, opts);
    if (dataUrl) {
      return {
        url,
        dataUrl,
      };
    }
  } catch (error) {
    return {
      url,
      dataUrl: url,
    };
  }
}
