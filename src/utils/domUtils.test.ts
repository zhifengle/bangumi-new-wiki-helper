/**
 * @jest-environment jsdom
 */
import {
  createFetchDataIframe,
  findElement,
  findAllElement,
  getText,
  htmlToElement,
  loadIframe,
} from './domUtils';

function createIframeFixture(id: string, bodyHtml: string) {
  const iframe = document.createElement('iframe');
  const iframeDoc = document.implementation.createHTMLDocument(id);

  iframe.id = id;
  iframeDoc.body.innerHTML = bodyHtml;
  Object.defineProperty(iframe, 'contentDocument', {
    configurable: true,
    value: iframeDoc,
  });
  document.body.appendChild(iframe);

  return iframe;
}

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

  test('findElement supports plain selectors inside a scoped parent', () => {
    document.body.innerHTML = `
      <section id="outside">
        <h1>Outside Title</h1>
      </section>
      <section id="content">
        <div class="subject">
          <h1>Scoped Title</h1>
        </div>
      </section>
    `;
    const subject = document.querySelector('#content .subject');

    expect(findElement({ selector: 'h1' }, subject)?.textContent).toBe(
      'Scoped Title'
    );
  });

  test('findElement falls back through selector arrays like doubanGameModel', () => {
    document.body.innerHTML = `
      <div id="content">
        <dl class="thing-attr">
          <dt>发行日期</dt>
          <dd>2024-01-01</dd>
          <dt>发行日期</dt>
          <dd>2025-02-02</dd>
        </dl>
      </div>
    `;

    const result = findElement([
      {
        selector: '#content .thing-attr',
        subSelector: 'dt',
        keyWord: '预计上市时间',
        sibling: true,
      },
      {
        selector: '#content .thing-attr',
        subSelector: 'dt',
        keyWord: '发行日期',
        sibling: true,
      },
    ]);

    expect(result?.textContent).toBe('2025-02-02');
  });

  test('findElement follows nextSelector arrays like amazonJpMusicModel', () => {
    document.body.innerHTML = `
      <div id="bylineInfo">
        <div class="author">
          <span>(アーティスト)</span>
          <a href="/artist">Artist Link</a>
        </div>
      </div>
    `;

    const result = findElement({
      selector: '#bylineInfo',
      subSelector: '.author',
      keyWord: /\(アーティスト\)/,
      nextSelector: [
        {
          selector: '.contributorNameID',
        },
        {
          selector: 'a',
        },
      ],
    });

    expect(result?.tagName).toBe('A');
    expect(result?.textContent).toBe('Artist Link');
  });

  test('findElement treats plain string keywords as literal text', () => {
    document.body.innerHTML = `
      <div id="info">
        <div class="line">C++</div>
        <div class="value">Literal Match</div>
      </div>
    `;

    const result = findElement({
      selector: '#info',
      subSelector: '.line',
      keyWord: 'C++',
      sibling: true,
    });

    expect(result?.textContent).toBe('Literal Match');
  });

  test('findElement returns the keyword-matched element without sibling like steamModel website selector', () => {
    document.body.innerHTML = `
      <div class="responsive_apppage_details_left game_details">
        <div class="details_block">
          <a class="linkbar" href="https://example.com">Visit the website</a>
        </div>
      </div>
    `;

    const result = findElement({
      selector: '.responsive_apppage_details_left.game_details',
      subSelector: '.details_block > .linkbar',
      keyWord: ['访问网站', 'Visit the website'],
    });

    expect(result?.tagName).toBe('A');
    expect(result?.getAttribute('href')).toBe('https://example.com');
  });

  test('findElement supports sibling plus nextSelector chains like doubanGameEditModel cover selector', () => {
    document.body.innerHTML = `
      <div id="thing-modify">
        <div class="thing-item">
          <div class="desc-item">
            <span class="label">图标</span>
            <div class="value">
              <img src="cover.jpg" alt="cover" />
            </div>
          </div>
        </div>
      </div>
    `;

    const result = findElement({
      selector: '#thing-modify',
      subSelector: '.thing-item .desc-item .label',
      keyWord: '图标',
      sibling: true,
      nextSelector: {
        selector: 'img',
      },
    });

    expect(result?.tagName).toBe('IMG');
    expect(result?.getAttribute('src')).toBe('cover.jpg');
  });

  test('findElement supports nested nextSelector chains like steamdbModel cover selector', () => {
    document.body.innerHTML = `
      <table id="js-assets-table">
        <tbody>
          <tr>
            <td>library_assets</td>
            <td>
              <table class="web-assets">
                <tbody>
                  <tr>
                    <td>library_capsule</td>
                    <td><a href="/cover">Cover Link</a></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    `;

    const result = findElement({
      selector: '#js-assets-table',
      subSelector: 'td',
      keyWord: 'library_assets',
      sibling: true,
      nextSelector: {
        selector: 'table.web-assets',
        subSelector: 'td',
        keyWord: 'library_capsule',
        sibling: true,
        nextSelector: {
          selector: 'a',
        },
      },
    });

    expect(result?.tagName).toBe('A');
    expect(result?.textContent).toBe('Cover Link');
  });

  test('findElement can recurse into iframe content like dmmGameCharaModel', () => {
    createIframeFixture(
      'if_view',
      '<div class="guide-sect"><div class="guide-box-chr">Alice</div></div>'
    );

    const result = findElement({
      selector: '#if_view',
      isIframe: true,
      subSelector: 'body',
      nextSelector: {
        selector: '.guide-sect .guide-box-chr',
      },
    });

    expect(result?.textContent).toBe('Alice');
  });

  test('findElement supports iframe nextSelector with inner keyword matching like dmmGameModel summary selector', () => {
    createIframeFixture(
      'if_view',
      `
        <div id="guide-content">
          <div class="guide-capt">作品紹介</div>
          <div class="summary">Story body</div>
        </div>
      `
    );

    const result = findElement({
      selector: '#if_view',
      isIframe: true,
      subSelector: 'body',
      nextSelector: {
        selector: '#guide-content',
        subSelector: '.guide-capt',
        keyWord: '作品紹介',
        sibling: true,
      },
    });

    expect(result?.className).toBe('summary');
    expect(result?.textContent).toBe('Story body');
  });

  test('findElement can use a fetched iframe document as the query context', () => {
    const iframeDoc = document.implementation.createHTMLDocument('bookDesc');

    iframeDoc.body.innerHTML = '<div id="iframeContent">Remote Summary</div>';

    const result = findElement(
      {
        selector: '#bookDesc_iframe',
        subSelector: '#iframeContent',
        isIframe: true,
      },
      iframeDoc
    );

    expect(result?.textContent).toBe('Remote Summary');
  });

  test('findAllElement collects sibling matches for every matching keyword', () => {
    document.body.innerHTML = `
      <div id="content">
        <dl class="thing-attr">
          <dt>开发商</dt>
          <dd>Studio A</dd>
          <dt>开发商</dt>
          <dd>Studio B</dd>
        </dl>
      </div>
    `;

    const results = findAllElement({
      selector: '#content .thing-attr',
      subSelector: 'dt',
      keyWord: '开发商',
      sibling: true,
    });

    expect(results.map((item) => item.textContent)).toEqual([
      'Studio A',
      'Studio B',
    ]);
  });

  test('findAllElement falls back through selector arrays like doubanGameModel', () => {
    document.body.innerHTML = `
      <div id="content">
        <dl class="thing-attr">
          <dt>发行日期</dt>
          <dd>2024-01-01</dd>
          <dt>发行日期</dt>
          <dd>2025-02-02</dd>
        </dl>
      </div>
    `;

    const results = findAllElement([
      {
        selector: '#content .thing-attr',
        subSelector: 'dt',
        keyWord: '预计上市时间',
        sibling: true,
      },
      {
        selector: '#content .thing-attr',
        subSelector: 'dt',
        keyWord: '发行日期',
        sibling: true,
      },
    ]);

    expect(results.map((item) => item.textContent)).toEqual([
      '2024-01-01',
      '2025-02-02',
    ]);
  });

  test('findAllElement reads direct iframe subSelector matches when content exists', () => {
    createIframeFixture(
      'bookDesc_iframe',
      '<div><p class="desc">Line 1</p><p class="desc">Line 2</p></div>'
    );

    const results = findAllElement({
      selector: '#bookDesc_iframe',
      subSelector: '.desc',
      isIframe: true,
    });

    expect(results.map((item) => item.textContent)).toEqual([
      'Line 1',
      'Line 2',
    ]);
  });

  test('findAllElement follows iframe nextSelector chains like dmmGameCharaModel', () => {
    createIframeFixture(
      'if_view',
      `
        <div class="guide-sect">
          <div class="guide-box-chr">Alice</div>
          <div class="guide-box-chr">Bob</div>
        </div>
      `
    );

    const results = findAllElement({
      selector: '#if_view',
      isIframe: true,
      subSelector: 'body',
      nextSelector: {
        selector: '.guide-sect .guide-box-chr',
      },
    });

    expect(results.map((item) => item.textContent)).toEqual(['Alice', 'Bob']);
  });

  test('findAllElement keeps nextSelector scoped to the provided parent', () => {
    document.body.innerHTML = `
      <section id="outside">
        <div class="group">
          <span class="value">Outside</span>
        </div>
      </section>
      <section id="inside">
        <div class="group">
          <span class="value">Inside</span>
        </div>
      </section>
    `;
    const parent = document.querySelector('#inside');

    const results = findAllElement(
      {
        selector: '.group',
        nextSelector: {
          selector: '.value',
        },
      },
      parent
    );

    expect(results.map((item) => item.textContent)).toEqual(['Inside']);
  });

  test('findAllElement expands nextSelector across every matching parent', () => {
    document.body.innerHTML = `
      <div class="group">
        <span class="value">A1</span>
        <span class="value">A2</span>
      </div>
      <div class="group">
        <span class="value">B1</span>
      </div>
    `;

    const results = findAllElement({
      selector: '.group',
      nextSelector: {
        selector: '.value',
      },
    });

    expect(results.map((item) => item.textContent)).toEqual(['A1', 'A2', 'B1']);
  });

  test('findAllElement can use a fetched iframe document with nextSelector chains', () => {
    const iframeDoc = document.implementation.createHTMLDocument('if_view');

    iframeDoc.body.innerHTML = `
      <div class="guide-sect">
        <div class="guide-box-chr">Remote Alice</div>
        <div class="guide-box-chr">Remote Bob</div>
      </div>
    `;

    const results = findAllElement(
      {
        selector: '#if_view',
        isIframe: true,
        subSelector: 'body',
        nextSelector: {
          selector: '.guide-sect .guide-box-chr',
        },
      },
      iframeDoc
    );

    expect(results.map((item) => item.textContent)).toEqual([
      'Remote Alice',
      'Remote Bob',
    ]);
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
