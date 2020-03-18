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

/**
 * convert base64/URLEncoded data component to raw binary data held in a string
 * https://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
 * @param dataURI
 */
export function dataURItoBlob(dataURI: string): Blob {
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = decodeURI(dataURI.split(',')[1]);  // instead of unescape
  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ia], {type:mimeString});
}

export function getImageDataByURL(url: string): Promise<string> {
  if (!url) return Promise.reject('invalid img url');
  return fetchBinary(url).then(myBlob => {
    console.info('pic: ', myBlob);
    return blobToBase64(myBlob);
  });
}
