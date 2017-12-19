import { gmFetchBinary } from './gmFetch';

function getImageSuffix(url) {
  var m = url.match(/png|jpg|jpeg|gif|bmp/);
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

function getImageBase64(url) {
  return gmFetchBinary(url).then((info) => {
    var bytes = [];
    for (var i = 0; i < info.length; i++) {
      bytes[i] = info.charCodeAt(i) & 0xff;
    }
    var binary = String.fromCharCode.apply(String, bytes);
    return 'data:image/' + getImageSuffix(url) + ';base64,' + btoa(binary);
  });
}

function blobToBase64(myBlob) {
  return new Promise((resolve, reject) => {
    var reader = new window.FileReader();
    reader.readAsDataURL(myBlob);
    reader.onloadend = function() {
      resolve(reader.result);
    };
    reader.onerror = reject;
  });
}

function getImageDataByURL(url) {
  return gmFetchBinary(url).then(myBlob => {
    console.info('pic: ', myBlob);
    return blobToBase64(myBlob);
  });
}

export {
  getImageDataByURL,
  getImageBase64
};
