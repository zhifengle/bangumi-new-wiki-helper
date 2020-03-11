// TODO: support GM_XMLHttpRequest

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
function internalFetch<R>(fetchPromise: Promise<R>, TIMEOUT: number): Promise<any>{
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
