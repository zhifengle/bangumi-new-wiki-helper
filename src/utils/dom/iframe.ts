export function createFetchDataIframe(): HTMLIFrameElement {
  const iframeId = 'e-userjs-fetch-data';
  let $iframe = document.querySelector<HTMLIFrameElement>(`#${iframeId}`);
  if (!$iframe) {
    $iframe = document.createElement('iframe');
    $iframe.setAttribute(
      'sandbox',
      'allow-forms allow-same-origin allow-scripts'
    );
    $iframe.style.display = 'none';
    $iframe.id = iframeId;
    document.body.appendChild($iframe);
  }
  return $iframe;
}

/**
 * 载入 iframe
 * @param $iframe iframe DOM
 * @param src iframe URL
 * @param TIMEOUT time out
 */
export function loadIframe(
  $iframe: HTMLIFrameElement,
  src: string,
  TIMEOUT = 10000
) {
  return new Promise((resolve, reject) => {
    $iframe.src = src;
    const timer = setTimeout(() => {
      $iframe.onload = undefined;
      reject(new Error('iframe timeout'));
    }, TIMEOUT);
    $iframe.onload = () => {
      clearTimeout(timer);
      $iframe.onload = null;
      resolve(undefined);
    };
  });
}
