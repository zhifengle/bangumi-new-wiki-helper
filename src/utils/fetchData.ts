// support GM_XMLHttpRequest
const ENV_FLAG = '__ENV_EXT__';

type IAjaxType = 'text' | 'json' | 'blob';

export function fetchInfo(
  url: string,
  type: IAjaxType,
  opts: any = {},
  TIMEOUT = 10 * 1000
): Promise<any> {
  // @ts-ignore
  if (ENV_FLAG === '__ENV_GM__') {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      GM_xmlhttpRequest({
        method: 'GET',
        timeout: TIMEOUT,
        url,
        responseType: type,
        onload: function (res: any) {
          resolve(res.response);
        },
        onerror: reject,
        ...opts,
      });
    });
  }
  return internalFetch(
    fetch(url, {
      method: 'GET',
      // credentials: 'include',
      // mode: 'cors',
      // cache: 'default',
      ...opts,
    }),
    TIMEOUT
  ).then(
    (response) => response[type](),
    (err) => console.log('fetch err: ', err)
  );
}

export function fetchBinary(url: string, opts: any = {}): Promise<Blob> {
  return fetchInfo(url, 'blob', opts);
}

export function fetchText(url: string, TIMEOUT = 10 * 1000): Promise<string> {
  return fetchInfo(url, 'text', {}, TIMEOUT);
}
export function fetchJson(url: string, opts: any = {}): Promise<any> {
  return fetchInfo(url, 'json', opts);
}

// TODO: promise type
function internalFetch<R>(
  fetchPromise: Promise<R>,
  TIMEOUT: number
): Promise<any> {
  let abortFn: null | Function = null;
  const abortPromise = new Promise(function (resolve, reject) {
    abortFn = function () {
      reject('abort promise');
    };
  });

  let abortablePromise = Promise.race([fetchPromise, abortPromise]);
  setTimeout(function () {
    abortFn();
  }, TIMEOUT);
  return abortablePromise;
}
