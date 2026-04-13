export type HeaderListenerOption = 'blocking' | 'requestHeaders' | 'extraHeaders';

export type WebRequestHeader = {
  name: string;
  value?: string;
};

export type WebRequestDetails = {
  url?: string;
  requestHeaders?: WebRequestHeader[];
};

export type ChromeGlobals = typeof globalThis & {
  chrome?: {
    webRequest?: {
      OnBeforeSendHeadersOptions?: {
        EXTRA_HEADERS?: unknown;
      };
    };
  };
};

export function isChromeUserAgent(userAgent: string) {
  return /Chrome\/(\d+)\.(\d+)/.test(userAgent);
}

export function hasExtraHeadersSupport() {
  const options = (globalThis as ChromeGlobals).chrome?.webRequest
    ?.OnBeforeSendHeadersOptions;
  return !!options && Object.prototype.hasOwnProperty.call(options, 'EXTRA_HEADERS');
}

export function createHeaderListenerOptions(
  type: Extract<HeaderListenerOption, 'requestHeaders'>,
  enableExtraHeaders: boolean
): HeaderListenerOption[] {
  const result: HeaderListenerOption[] = ['blocking', type];
  if (enableExtraHeaders) {
    result.push('extraHeaders');
  }
  return result;
}

export function appendGetchuRefererHeader(details: WebRequestDetails) {
  const match = (details?.url ?? '').match(/brandnew\/(\d+)/);
  const requestHeaders = [...(details.requestHeaders ?? [])];
  if (match) {
    requestHeaders.push({
      name: 'Referer',
      value: `http://www.getchu.com/soft.phtml?id=${match[1]}`,
    });
  }
  return { requestHeaders };
}
