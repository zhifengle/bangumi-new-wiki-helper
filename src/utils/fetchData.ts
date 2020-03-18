// support GM_XMLHttpRequest
const ENV_FLAG = '__ENV_EXT__';

export function fetchBinary(url: string, TIMEOUT = 10 * 1000): Promise<Blob> {
  return internalFetch(fetch(url, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    cache: 'default'
  }), TIMEOUT)
    .then(response => response.blob(),
      err => console.log('fetch err: ', err))
}

export function fetchText(url: string, TIMEOUT = 10 * 1000): Promise<string> {
  // @ts-ignore
  if (ENV_FLAG === '__ENV_GM__') {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      GM_xmlhttpRequest({
        method: "GET",
        timeout: TIMEOUT || 10 * 1000,
        url: url,
        // @ts-ignore
        onreadystatechange: function (response) {
          if (response.readyState === 4 && response.status === 200) {
            resolve(response.responseText);
          }
        },
        // @ts-ignore
        onerror: function (err) {
          reject(err);
        },
        // @ts-ignore
        ontimeout: function (err) {
          reject(err);
        }
      });
    });
  }
  return internalFetch(fetch(url, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    cache: 'default'
  }), TIMEOUT)
    .then(response => response.text(),
      err => console.log('fetch err: ', err))
}

// TODO: promise type
function internalFetch<R>(fetchPromise: Promise<R>, TIMEOUT: number): Promise<any> {
  let abortFn: null | Function = null
  const abortPromise = new Promise(function (resolve, reject) {
    abortFn = function () {
      reject('abort promise')
    }
  })

  let abortablePromise = Promise.race([
    fetchPromise,
    abortPromise
  ])
  setTimeout(function () {
    abortFn()
  }, TIMEOUT);
  return abortablePromise;
}
