/**
 * @jest-environment jsdom
 */
import { sendForm, sendFormImg } from './ajax';

type MockXhr = {
  method?: string;
  url?: string;
  body?: FormData;
  status: number;
  responseURL: string;
  onload: null | (() => void);
  onerror: null | (() => void);
  open: (method: string, url: string, async: boolean) => void;
  send: (body: FormData) => void;
};

describe('ajax helpers', () => {
  const OriginalXMLHttpRequest = window.XMLHttpRequest;

  function installMockXhr(responseURL = 'https://bgm.tv/subject/1') {
    const mockXhr: MockXhr = {
      status: 200,
      responseURL,
      onload: null,
      onerror: null,
      open(method, url) {
        this.method = method;
        this.url = url;
      },
      send(body) {
        this.body = body;
        this.onload?.();
      },
    };
    window.XMLHttpRequest = jest
      .fn(() => mockXhr as unknown as XMLHttpRequest) as unknown as typeof XMLHttpRequest;
    return mockXhr;
  }

  afterEach(() => {
    document.body.innerHTML = '';
    window.XMLHttpRequest = OriginalXMLHttpRequest;
  });

  test('sendForm appends extra values and submit button data', async () => {
    document.body.innerHTML = `
      <form method="post" action="https://bgm.tv/create">
        <input name="name" value="原始标题" />
        <input name="submit" value="保存" />
      </form>
    `;
    const mockXhr = installMockXhr();
    const $form = document.querySelector<HTMLFormElement>('form')!;

    const result = await sendForm($form, [
      {
        name: 'rating',
        value: 5,
      },
    ]);

    expect(result).toBe('https://bgm.tv/subject/1');
    expect(mockXhr.method).toBe('POST');
    expect(mockXhr.url).toBe('https://bgm.tv/create');
    expect(mockXhr.body?.get('name')).toBe('原始标题');
    expect(mockXhr.body?.get('rating')).toBe('5');
    expect(mockXhr.body?.get('submit')).toBe('保存');
  });

  test('sendFormImg uses the file input name and uploads a blob', async () => {
    document.body.innerHTML = `
      <form method="post" action="https://bgm.tv/upload">
        <input type="file" name="cover" />
      </form>
    `;
    const mockXhr = installMockXhr('https://bgm.tv/uploaded');
    const $form = document.querySelector<HTMLFormElement>('form')!;

    const result = await sendFormImg($form, 'data:image/png;base64,aGVsbG8=');

    expect(result).toBe('https://bgm.tv/uploaded');
    expect(mockXhr.body?.get('cover')).toBeInstanceOf(Blob);
  });
});
