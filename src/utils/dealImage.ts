import { IFetchOpts } from '../interface/types';
import { fetchBinary } from './fetchData';

function getImageSuffix(url: string) {
  const m = url.match(/png|jpg|jpeg|gif|bmp/);
  if (m) {
    switch (m[0]) {
      case 'png':
        return 'png';
      case 'jpg':
      case 'jpeg':
        return 'jpeg';
      case 'gif':
        return 'gif';
      case 'bmp':
        return 'bmp';
    }
  }
  return '';
}

export function getImageBase64(url: string): Promise<string> {
  return fetchBinary(url).then(async (blob) => {
    const dataUrl = await blobToBase64(blob);
    const suffix = getImageSuffix(url);
    if (!suffix) {
      return dataUrl;
    }
    return dataUrl.replace(/^data:[^;]+/i, `data:image/${suffix}`);
  });
}

function blobToBase64(myBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader: FileReader = new window.FileReader();
    reader.readAsDataURL(myBlob);
    reader.onloadend = function () {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('failed to convert blob to base64'));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('failed to read blob'));
    };
  });
}

/**
 * convert base64/URLEncoded data component to raw binary data held in a string
 * https://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
 * @param dataURI
 */
export function dataURItoBlob(dataURI: string): Blob {
  let byteString: string;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else byteString = decodeURI(dataURI.split(',')[1]); // instead of unescape
  // separate out the mime component
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  // write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], { type: mimeString });
}

export function getImageDataByURL(
  url: string,
  opts: IFetchOpts = {}
): Promise<string> {
  if (!url) {
    return Promise.reject(new Error('invalid img url'));
  }
  return new Promise<string>(async (resolve, reject) => {
    try {
      const blob = await fetchBinary(url, opts);
      if (blob.type && !blob.type.toLowerCase().startsWith('image/')) {
        throw new Error(`unexpected image response type: ${blob.type}`);
      }
      const reader = new FileReader();
      reader.onloadend = function () {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('failed to convert blob to data url'));
      };
      reader.readAsDataURL(blob);
      reader.onerror = () => {
        reject(reader.error ?? new Error('failed to read image blob'));
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * convert to img Element to base64 string
 * @param $img
 */
export function convertImgToBase64($img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = $img.width;
  canvas.height = $img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('canvas 2d context is unavailable');
  }
  ctx.drawImage($img, 0, 0, $img.width, $img.height);
  const dataURL = canvas.toDataURL('image/png');
  return dataURL;
}
