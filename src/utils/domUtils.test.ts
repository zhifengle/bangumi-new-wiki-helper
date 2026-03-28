/**
 * @jest-environment jsdom
 */
import {
  createFetchDataIframe,
  findAllElement,
  getText,
  htmlToElement,
  loadIframe,
} from './domUtils';

describe('domUtils helpers', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  test('getText reads meta, input and plain element content', () => {
    const meta = document.createElement('meta');
    const input = document.createElement('input');
    const div = document.createElement('div');

    meta.content = 'meta-content';
    input.value = 'input-value';
    div.textContent = 'plain-text';

    expect(getText(meta)).toBe('meta-content');
    expect(getText(input)).toBe('input-value');
    expect(getText(div)).toBe('plain-text');
  });

  test('htmlToElement returns the root element', () => {
    const node = htmlToElement<HTMLDivElement>(
      '<div class="root"><span>child</span></div>'
    );

    expect(node.className).toBe('root');
    expect(node.querySelector('span')?.textContent).toBe('child');
  });

  test('createFetchDataIframe creates and reuses a hidden iframe', () => {
    const first = createFetchDataIframe();
    const second = createFetchDataIframe();

    expect(first).toBe(second);
    expect(first.id).toBe('e-userjs-fetch-data');
    expect(first.style.display).toBe('none');
    expect(first.getAttribute('sandbox')).toContain('allow-scripts');
  });

  test('findAllElement returns an empty array when iframe content is unavailable', () => {
    expect(
      findAllElement({
        selector: '#missing-iframe',
        subSelector: '.item',
        isIframe: true,
      })
    ).toEqual([]);
  });

  test('loadIframe resolves when the iframe fires load', async () => {
    const iframe = document.createElement('iframe');
    const pending = loadIframe(iframe, 'https://example.com/frame', 100);

    iframe.onload?.(new Event('load'));

    await expect(pending).resolves.toBeUndefined();
  });

  test('loadIframe rejects when the iframe times out', async () => {
    jest.useFakeTimers();
    const iframe = document.createElement('iframe');
    const pending = loadIframe(iframe, 'https://example.com/frame', 10);
    const rejection = expect(pending).rejects.toThrow('iframe timeout');

    await jest.advanceTimersByTimeAsync(10);

    await rejection;
    expect(iframe.onload).toBeNull();
  });
});
