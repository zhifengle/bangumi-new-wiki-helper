import { genRandomStr } from './utils';

export type FormValue = Blob | File | string | number;

export interface FormItem {
  name: string;
  value: FormValue;
  filename?: string;
}

function appendFormItem(fd: FormData, item: FormItem) {
  if (item.filename) {
    fd.set(item.name, item.value as Blob, item.filename);
    return;
  }
  if (item.value instanceof Blob) {
    fd.set(item.name, item.value);
    return;
  }
  fd.set(item.name, String(item.value));
}

export function sendFormImg($form: HTMLFormElement, image: Blob) {
  const $file = $form.querySelector<HTMLInputElement>('input[type=file]');
  return sendForm($form, [
    {
      name: $file?.name || 'picfile',
      value: image,
      filename: `${genRandomStr(5)}.png`,
    },
  ]);
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
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fd = new FormData($form);
    extraInfo.forEach((item) => {
      appendFormItem(fd, item);
    });
    const $submit = $form.querySelector<HTMLInputElement>('[name=submit]');
    if ($submit?.name && $submit.value) {
      fd.set($submit.name, $submit.value);
    }
    const xhr = new XMLHttpRequest();
    xhr.open(($form.method || 'POST').toUpperCase(), $form.action, true);
    xhr.onload = function () {
      if (xhr.status !== 200) {
        reject(new Error(`request failed with status ${xhr.status}`));
        return;
      }
      if (xhr.responseURL) {
        resolve(xhr.responseURL);
        return;
      }
      reject(new Error('no location'));
    };
    xhr.onerror = function () {
      reject(new Error('request failed'));
    };
    xhr.send(fd);
  });
}
