import { CharaModel, ModelKey, SiteConfig } from '../interface/wiki';
import { getImageDataByURL } from '../utils/dealImage';

export async function getCover($d: Element, site: ModelKey) {
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
    // 在其它网站上获取的相对路径的链接
    // @TODO 这里临时使用的全局变量来处理
    if (window._fetch_url_bg && !/^https?:/.test(url)) {
      const urlObj = new URL(window._fetch_url_bg);
      url = `${urlObj.origin}/${url.replace(/^\.?\/?/, '')}`;
    }
    // 跨域的图片不能用这种方式
    // dataUrl = convertImgToBase64($d as any);
    let opts: any = {};
    if (site.includes('getchu')) {
      opts.headers = {
        Referer: location.href,
      };
      if (!location.href.includes('getchu.com') && window._fetch_url_bg) {
        opts.headers.Referer = window._fetch_url_bg;
      }
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

export const charaInfoDict: any = {
  趣味: '爱好',
  誕生日: '生日',
  '3サイズ': 'BWH',
  スリーサイズ: 'BWH',
  身長: '身高',
  血液型: '血型',
};
