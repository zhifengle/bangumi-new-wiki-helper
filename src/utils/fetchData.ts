import { IFetchOpts } from '../interface/types';

// support GM_XMLHttpRequest
const ENV_FLAG = '__ENV_EXT__';

type IAjaxType = 'text' | 'json' | 'blob' | 'arraybuffer';

export function fetchInfo(
  url: string,
  type: IAjaxType,
  opts: IFetchOpts = {},
  TIMEOUT = 10 * 1000
): Promise<any> {
  const method = opts?.method?.toUpperCase() || 'GET';
  // @ts-ignore
  if (ENV_FLAG === '__ENV_GM__') {
    const gmXhrOpts = { ...opts };
    if (method === 'POST' && gmXhrOpts.body) {
      gmXhrOpts.data = gmXhrOpts.body;
    }
    if (opts.decode) {
      type = 'arraybuffer';
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
          if (opts.decode && type === 'arraybuffer') {
            let decoder = new TextDecoder(opts.decode);
            resolve(decoder.decode(res.response));
          } else {
            resolve(res.response);
          }
        },
        onerror: reject,
        ...gmXhrOpts,
      });
    });
  }
  if (method === 'POST' && opts.data) {
    opts.body = opts.data;
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
        if (opts.decode) {
          return response.arrayBuffer().then((buffer: ArrayBuffer) => {
            let decoder = new TextDecoder(opts.decode);
            let text = decoder.decode(buffer);
            return text;
          });
        }
        return response[type]();
      }
      throw new Error('Not 2xx response');
    },
    (err) => console.log('fetch err: ', err)
  );
}

export function fetchBinary(url: string, opts: IFetchOpts = {}): Promise<Blob> {
  return fetchInfo(url, 'blob', opts);
}

export function fetchText(
  url: string,
  opts: IFetchOpts = {},
  TIMEOUT = 10 * 1000
): Promise<string> {
  return fetchInfo(url, 'text', opts, TIMEOUT);
}
export function fetchJson(url: string, opts: IFetchOpts = {}): Promise<any> {
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
