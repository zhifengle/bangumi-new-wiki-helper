// support GM_XMLHttpRequest
const ENV_FLAG = '__ENV_EXT__';

type IAjaxType = 'text' | 'json' | 'blob';

export function fetchInfo(
  url: string,
  type: IAjaxType,
  opts: any = {},
  TIMEOUT = 10 * 1000
): Promise<any> {
  const method = opts?.method?.toUpperCase() || 'GET';
  // @ts-ignore
  if (ENV_FLAG === '__ENV_GM__') {
    const gmXhrOpts = { ...opts };
    if (method === 'POST') {
      gmXhrOpts.data = gmXhrOpts.body;
    }
    return new Promise((resolve, reject) => {
      // @ts-ignore
      GM_xmlhttpRequest({
        method,
        timeout: TIMEOUT,
        url,
        responseType: type,
        onload: function (res: any) {
          if (res.status === 404) {
            reject(404);
          }
          resolve(res.response);
        },
        onerror: reject,
        ...gmXhrOpts,
      });
    });
  }
  return internalFetch(
    fetch(url, {
      method,
      // credentials: 'include',
      // mode: 'cors',
      // cache: 'default',
      ...opts,
    }),
    TIMEOUT
  ).then(
    (response) => {
      if (response.ok) {
        return response[type]();
      }
      throw new Error('Not 2xx response');
    },
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
