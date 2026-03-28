import { IFetchOpts } from '../interface/types';

// support GM_XMLHttpRequest
const ENV_FLAG: string = '__ENV_EXT__';

type IAjaxType = 'text' | 'json' | 'blob' | 'arraybuffer';
type FetchInfoResultMap = {
  text: string;
  json: unknown;
  blob: Blob;
  arraybuffer: ArrayBuffer;
};

type FetchRequestOptions = IFetchOpts & {
  method?: string;
  body?: BodyInit | null;
  data?: BodyInit | null;
  headers?: HeadersInit;
};

type GMRequestResponse<T> = {
  status: number;
  response: T;
};

type GMRequestOptions<T> = {
  method: string;
  timeout: number;
  url: string;
  responseType: IAjaxType;
  data?: BodyInit | null;
  onload: (response: GMRequestResponse<T>) => void;
  onerror: (error: unknown) => void;
} & Omit<FetchRequestOptions, 'method' | 'body' | 'data'>;

type GMRequestFunction = <T>(options: GMRequestOptions<T>) => void;

function getGMRequest() {
  return (globalThis as typeof globalThis & {
    GM_xmlhttpRequest?: GMRequestFunction;
  }).GM_xmlhttpRequest;
}

function resolveRequestBody(
  method: string,
  body?: BodyInit | null,
  data?: BodyInit | null
) {
  if (method === 'POST') {
    return data ?? body ?? null;
  }
  return body ?? null;
}

export function fetchInfo(
  url: string,
  type: 'text',
  opts?: FetchRequestOptions,
  TIMEOUT?: number
): Promise<string>;
export function fetchInfo<T = unknown>(
  url: string,
  type: 'json',
  opts?: FetchRequestOptions,
  TIMEOUT?: number
): Promise<T>;
export function fetchInfo(
  url: string,
  type: 'blob',
  opts?: FetchRequestOptions,
  TIMEOUT?: number
): Promise<Blob>;
export function fetchInfo(
  url: string,
  type: 'arraybuffer',
  opts?: FetchRequestOptions,
  TIMEOUT?: number
): Promise<ArrayBuffer>;

export function fetchInfo(
  url: string,
  type: IAjaxType,
  opts: FetchRequestOptions = {},
  TIMEOUT = 10 * 1000
): Promise<FetchInfoResultMap[IAjaxType]> {
  const method = opts?.method?.toUpperCase() || 'GET';
  const gmRequest = getGMRequest();
  if (ENV_FLAG === '__ENV_GM__' && gmRequest) {
    const { decode, method: _method, body, data, ...restOpts } = opts;
    const requestBody = resolveRequestBody(method, body, data);
    const responseType = decode ? 'arraybuffer' : type;
    return new Promise((resolve, reject) => {
      gmRequest<FetchInfoResultMap[typeof responseType]>({
        method,
        timeout: TIMEOUT,
        url,
        responseType,
        ...(requestBody ? { data: requestBody } : {}),
        onload(res) {
          if (res.status === 404) {
            reject(404);
            return;
          }
          if (decode && responseType === 'arraybuffer') {
            const decoder = new TextDecoder(decode);
            resolve(decoder.decode(res.response as ArrayBuffer));
          } else {
            resolve(res.response);
          }
        },
        onerror: reject,
        ...restOpts,
      });
    });
  }

  const { decode, method: _method, body, data, ...restOpts } = opts;
  const requestBody = resolveRequestBody(method, body, data);

  return internalFetch(
    fetch(url, {
      ...restOpts,
      method,
      body: requestBody,
    }),
    TIMEOUT
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Not 2xx response');
      }
      if (decode) {
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder(decode);
        return decoder.decode(buffer);
      }
      switch (type) {
        case 'text':
          return response.text();
        case 'json':
          return response.json();
        case 'blob':
          return response.blob();
        case 'arraybuffer':
          return response.arrayBuffer();
      }
      throw new Error('Not 2xx response');
    })
    .catch((err) => {
      console.log('fetch err: ', err);
      throw err;
    });
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
export function fetchJson<T = unknown>(
  url: string,
  opts: IFetchOpts = {}
): Promise<T> {
  return fetchInfo<T>(url, 'json', opts);
}

function internalFetch<T>(
  fetchPromise: Promise<T>,
  TIMEOUT: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('fetch timeout'));
    }, TIMEOUT);

    fetchPromise.then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
