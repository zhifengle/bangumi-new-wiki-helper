import { CharaModel, ModelKey, SiteConfig } from '../interface/wiki';
import { getImageDataByURL } from '../utils/dealImage';

export async function getCover($d: Element, site: ModelKey) {
  let url;
  let dataUrl = '';
  if ($d.tagName.toLowerCase() === 'a') {
    url = $d.getAttribute('href');
  } else if ($d.tagName.toLowerCase() === 'img') {
    url = $d.getAttribute('src');
  }
  if (!url) return;
  try {
    // 跨域的图片不能用这种方式
    // dataUrl = convertImgToBase64($d as any);
    let opts: any = {};
    if (site.includes('getchu')) {
      opts.headers = {
        Referer: location.href,
      };
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
