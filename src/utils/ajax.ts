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
export async function sendFormImg($form: HTMLFormElement, dataURL: string) {
  const info: FormItem[] = [];
  const $file: HTMLInputElement = $form.querySelector('input[type=file]');
  const inputFileName = $file.name ? $file.name : 'picfile';
  info.push({
    name: inputFileName,
    value: dataURItoBlob(dataURL),
    filename: genRandomStr(5) + '.png'
  } as FormItem)
  return await sendForm($form, info);
}

/**
 * send form as xhr promise
 * TODO: return type
 * @param $form
 * @param extraInfo
 */
export function sendForm(
  $form: HTMLFormElement,
  extraInfo: FormItem[] = []
): Promise<any> {
  return new Promise((resolve, reject) => {
    const fd = new FormData($form);
    extraInfo.forEach(item => {
      if (item.filename) {
        fd.set(item.name, item.value as Blob, item.filename)
      } else {
        fd.set(item.name, item.value as any)
      }
    })
    const $submit = $form.querySelector('[name=submit]') as HTMLInputElement;
    if ($submit && $submit.name && $submit.value) {
      fd.set($submit.name, $submit.value)
    }
    const xhr = new XMLHttpRequest();
    xhr.open($form.method.toLowerCase(), $form.action, true);
    xhr.onload = function () {
      let _location;
      if (xhr.status === 200) {
        _location = xhr.responseURL;
        if (_location) {
          resolve(_location);
        } else {
          reject('no location');
        }
      }
    };
    xhr.send(fd);
  });
}
