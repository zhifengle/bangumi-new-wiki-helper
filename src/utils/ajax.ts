import {genRandomStr} from './utils'
import {dataURItoBlob} from './dealImage'

interface FormItem {
  name: string,
  value: Blob | File | string | number,
  filename?: string
}

/**
 * send form data with image
 * @param $form
 * @param dataURL
 */
export function sendFormImg($form: HTMLFormElement, dataURL: string)
  : Promise<string> {
  const info: FormItem[] = [];
  const $file: HTMLInputElement = $form.querySelector('input[type=file]');
  const inputFileName = $file.name ? $file.name : 'picfile';
  info.push({
    name: inputFileName,
    value: dataURItoBlob(dataURL),
    filename: genRandomStr(5) + '.jpg'
  } as FormItem)
  return sendForm($form, info)
}

/**
 * send form as xhr promise
 * TODO: return type
 * @param $form
 * @param extraInfo
 * @param TIMEOUT
 */
export function sendForm(
  $form: HTMLFormElement,
  extraInfo: FormItem[],
  TIMEOUT = 3000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const fd = new FormData($form);
    extraInfo.forEach(item => {
      if (item.filename) {
        fd.set(item.name, item.value as Blob | File, item.filename)
      }
      fd.set(item.name, item.value as any)
    })
    const xhr = new XMLHttpRequest();
    xhr.open($form.method.toLowerCase(), $form.action, true);
    xhr.onreadystatechange = function () {
      let _location;
      if (xhr.readyState === 2 && xhr.status === 200) {
        _location = xhr.responseURL;
        if (_location) {
          resolve(_location);
        }
        reject('no location');
      }
    };
    xhr.timeout = TIMEOUT;
    xhr.ontimeout = reject() as any;
    xhr.send(fd);
  });
}
