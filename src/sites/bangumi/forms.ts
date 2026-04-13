import { fetchText } from '../../utils/fetchData';
import { loadIframe } from '../../utils/domUtils';

export async function getFormhash(): Promise<string> {
  const rawText = await fetchText(
    `${location.protocol}//${location.host}/new_subject/1`
  );
  const $doc = new DOMParser().parseFromString(rawText, 'text/html');
  return $doc.querySelector<HTMLInputElement>('input[name=formhash]')?.value ?? '';
}

/**
 * 通过 iframe 获取表单
 * @param url 链接地址
 * @param formSelector 表单的 iframe
 * @returns Promise<HTMLFormElement>
 */
export async function getFormByIframe(url: string, formSelector: string) {
  const iframeId = 'e-userjs-iframe';
  let $iframe = document.querySelector<HTMLIFrameElement>(`#${iframeId}`);
  if (!$iframe) {
    $iframe = document.createElement('iframe');
    $iframe.style.display = 'none';
    $iframe.id = iframeId;
    document.body.appendChild($iframe);
  }
  await loadIframe($iframe, url, 20000);
  const $form = $iframe.contentDocument?.querySelector<HTMLFormElement>(formSelector);
  if (!$form) {
    throw new Error(`form not found: ${formSelector}`);
  }
  return $form;
}
