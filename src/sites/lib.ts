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
    dataUrl = await getImageDataByURL(url);
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
