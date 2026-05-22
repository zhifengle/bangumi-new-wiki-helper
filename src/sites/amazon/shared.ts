import { SingleInfo } from '../../interface/subjectInfo';
import { getImageDataByURL } from '../../utils/dealImage';

interface AmazonCoverInfoOptions {
  imageUrlTransform?: (url: string) => string;
}

function isAmazonImageUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return (
      (parsedUrl.hostname === 'm.media-amazon.com' ||
        parsedUrl.hostname.endsWith('.ssl-images-amazon.com') ||
        parsedUrl.hostname === 'images.amazon.com') &&
      parsedUrl.pathname.startsWith('/images/')
    );
  } catch (error) {
    return false;
  }
}

export function toAmazonAcSl1500ImageUrl(url: string) {
  if (!isAmazonImageUrl(url)) {
    return url;
  }

  return url.replace(/(?:\._[^/.]+_)?\.(jpe?g)(\?.*)?$/i, '._AC_SL1500_.$1$2');
}

export const amazonUtils = {
  dealTitle(str: string = ''): string {
    str = str.trim().split('\n')[0].trim();
    const textList = [
      '\\([^0-9]+?\\)$',
      '（[^0-9]+?）$',
      '\\(.+?\\d+.+?\\)$',
      '（.+?\\d+.+?）$',
    ];
    str = str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
    return str;
  },
  getUrlDp(str: string): string {
    const m = str.match(/\/dp\/(.*?)\//);
    if (m) {
      return m[1];
    }
    return '';
  },
};

export async function getAmazonCoverInfo(
  res: SingleInfo[],
  options: AmazonCoverInfoOptions = {}
) {
  const $cover = document.querySelector(
    '#imgTagWrapperId>img'
  ) as HTMLImageElement;
  if ($cover && !res.find((obj) => obj.name === 'cover')) {
    let url = '';
    if ($cover.hasAttribute('data-old-hires')) {
      url = $cover.getAttribute('data-old-hires');
    } else if ($cover.hasAttribute('data-a-dynamic-image')) {
      try {
        const obj = JSON.parse($cover.getAttribute('data-a-dynamic-image'));
        const urlArr = Object.keys(obj).sort().reverse();
        if (urlArr && urlArr.length > 0) {
          url = urlArr[0];
        }
      } catch (error) {}
    }
    if (!url) {
      url = $cover.src;
    }
    const originalUrl = url;
    if (url && options.imageUrlTransform) {
      url = options.imageUrlTransform(url);
    }
    let dataUrl = url;
    try {
      if (url) {
        dataUrl = await getImageDataByURL(url);
      }
    } catch (error) {}
    if (dataUrl === url && originalUrl && originalUrl !== url) {
      try {
        dataUrl = await getImageDataByURL(originalUrl);
        url = originalUrl;
      } catch (error) {}
    }
    const info: SingleInfo = {
      category: 'cover',
      name: 'cover',
      value: {
        url,
        dataUrl,
      },
    };
    return info;
  }
}

