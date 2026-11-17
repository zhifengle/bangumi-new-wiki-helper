import { SingleInfo } from '../../interface/subjectInfo';
import { getImageDataByURL } from '../../utils/dealImage';

interface AmazonCoverInfoOptions {
  imageUrlTransform?: (url: string) => string;
}

const amazonCoverSelectors = [
  '#imgTagWrapperId > img',
  '#landingImage',
  '#main-image-container img[data-a-image-name="landingImage"]',
  '#imageBlock img[data-a-dynamic-image]',
];

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

function getLargestDynamicImageUrl($cover: HTMLImageElement) {
  const value = $cover.getAttribute('data-a-dynamic-image');
  if (!value) return '';

  try {
    const images = JSON.parse(value) as Record<string, unknown>;
    return Object.entries(images).reduce(
      (largest, [url, dimensions]) => {
        const [width = 0, height = 0] = Array.isArray(dimensions)
          ? dimensions.map(Number)
          : [];
        const area = width * height;
        return area > largest.area ? { url, area } : largest;
      },
      { url: '', area: -1 }
    ).url;
  } catch (error) {
    return '';
  }
}

function getAmazonCoverUrl($cover: HTMLImageElement) {
  return (
    $cover.getAttribute('data-old-hires')?.trim() ||
    getLargestDynamicImageUrl($cover) ||
    $cover.currentSrc ||
    $cover.getAttribute('src') ||
    ''
  );
}

function findAmazonCover(root: ParentNode) {
  for (const selector of amazonCoverSelectors) {
    const $cover = root.querySelector<HTMLImageElement>(selector);
    if ($cover) return $cover;
  }
}

function toHalfWidthDigits(str: string) {
  return str.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
}

function normalizeVolumeParenthesis(str: string) {
  return str.replace(
    /([\s　]*)[（(]\s*([0-9０-９]+)\s*[）)]/g,
    (_, spacing, volume) => {
      return `${spacing}(${toHalfWidthDigits(volume)})`;
    }
  );
}

export const amazonUtils = {
  dealTitle(str: string = ''): string {
    str = normalizeVolumeParenthesis(str.trim().split('\n')[0].trim());
    return str
      .replace(/[\s　]*\((?!\s*[0-9]+\s*\))[^()]*\)$/, '')
      .replace(/[\s　]*（(?!\s*[0-9０-９]+\s*）)[^（）]*）$/, '')
      .trim();
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
  options: AmazonCoverInfoOptions = {},
  root: ParentNode = document
) {
  const $cover = findAmazonCover(root);
  if ($cover && !res.find((obj) => obj.name === 'cover')) {
    let url = getAmazonCoverUrl($cover);
    if (!url) return;
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

