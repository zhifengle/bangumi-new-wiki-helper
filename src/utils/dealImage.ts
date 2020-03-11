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
  return ''
}

export function getImageBase64(url: string): Promise<string> {
  // TODO: info type
  return fetchBinary(url).then((info: any) => {
    const bytes = [];
    for (let i = 0; i < info.length; i++) {
      bytes[i] = info.charCodeAt(i) & 0xff;
    }
    const binary = String.fromCharCode.apply(String, bytes);
    return 'data:image/' + getImageSuffix(url) + ';base64,' + btoa(binary);
  });
}

function blobToBase64(myBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader: FileReader = new window.FileReader();
    reader.readAsDataURL(myBlob);
    reader.onloadend = function() {
      // @ts-ignore TODO: type
      resolve(reader.result);
    };
    reader.onerror = reject;
  });
}

export function getImageDataByURL(url: string): Promise<string> {
  return fetchBinary(url).then(myBlob => {
    console.info('pic: ', myBlob);
    return blobToBase64(myBlob);
  });
}
