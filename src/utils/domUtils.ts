import type { Selector, SelectorInput } from '../interface/wiki';
import type { TextPatternInput } from '../interface/textPattern';
import { matchesTextPatterns, toTextPatterns } from './textPattern';

type QueryContext = ParentNode | null;

let contextDom: QueryContext = null;

export function setCtxDom(dom: QueryContext) {
  contextDom = dom;
}

export function getCtxDom() {
  return contextDom;
}

export function clearCtxDom() {
  setCtxDom(null);
}

/**
 * 为页面添加样式
 * @param style
 */
export function addStyle(style: string) {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
}

/**
 * 获取节点文本
 * @param elem
 */
export function getText(elem?: Element | null): string {
  if (!elem) return '';
  if (elem instanceof HTMLMetaElement) {
    return elem.content;
  }
  if (
    elem instanceof HTMLInputElement ||
    elem instanceof HTMLTextAreaElement ||
    elem instanceof HTMLSelectElement
  ) {
    return elem.value;
  }
  return elem.textContent || (elem instanceof HTMLElement ? elem.innerText : '') || '';
}

export function getInnerText(elem?: HTMLElement | null): string {
  if (!elem) return '';
  return elem.innerText || elem.textContent || '';
}

/**
 * dollar 选择单个
 * @param {string} selector
 */
export function $q<E extends Element = Element>(selector: string): E | null {
  const ctxDom = getCtxDom();
  if (ctxDom) {
    return ctxDom.querySelector(selector);
  }
  return document.querySelector(selector);
}

/**
 * dollar 选择所有元素
 * @param {string} selector
 */
export function $qa<E extends Element>(selector: string): NodeListOf<E> {
  const ctxDom = getCtxDom();
  if (ctxDom) {
    return ctxDom.querySelectorAll(selector);
  }
  return document.querySelectorAll(selector);
}

/**
 * 插入自执行的函数的脚本
 * @param fn 回调函数
 * @param data 数据
 */
export function injectScript(fn: (...args: unknown[]) => unknown, data: unknown) {
  const script = document.createElement('script');
  script.innerHTML = `(${fn.toString()})(${data});`;
  document.body.appendChild(script);
}

/**
 * 查找包含文本的标签
 * @param {string} selector
 * @param {string} text
 */
export function contains(
  selector: string,
  text: TextPatternInput | undefined,
  $parent?: QueryContext
): Element[] {
  const elements = $parent
    ? Array.from($parent.querySelectorAll(selector))
    : Array.from($qa(selector));
  const patterns = toTextPatterns(text);
  if (!patterns.length) {
    return [];
  }
  return elements.filter((element) => {
    return matchesTextPatterns(getText(element), patterns, 'i');
  });
}

function isDocumentNode(node?: QueryContext): node is Document {
  return !!node && node.nodeType === Node.DOCUMENT_NODE;
}

function getIframeContext(
  selector: Selector,
  $parent?: QueryContext
): Document | null {
  if ($parent instanceof HTMLIFrameElement) {
    return $parent.contentDocument ?? null;
  }

  const $iframe = $parent?.querySelector<HTMLIFrameElement>(selector.selector);
  if ($iframe?.contentDocument) {
    return $iframe.contentDocument;
  }

  if (isDocumentNode($parent)) {
    return $parent;
  }

  return $q<HTMLIFrameElement>(selector.selector)?.contentDocument ?? null;
}

function findElementByKeyWord(
  selector: Selector,
  $parent?: QueryContext
): Element | null {
  let res: Element | null = null;
  if ($parent) {
    $parent = $parent.querySelector(selector.selector);
  } else {
    $parent = $q(selector.selector);
  }
  if (!$parent) return res;
  const targets = contains(selector.subSelector, selector.keyWord, $parent);
  if (targets && targets.length) {
    let $t = targets[targets.length - 1];
    // 相邻节点
    if (selector.sibling) {
      $t = targets[targets.length - 1].nextElementSibling;
    }
    return $t;
  }
  return res;
}

function isElement(element: Element | null): element is Element {
  return element !== null;
}

export function findElement(
  selector: SelectorInput,
  $parent?: QueryContext
): Element | null {
  let r: Element | null = null;
  if (selector) {
    if (selector instanceof Array) {
      let i = 0;
      let targetSelector = selector[i];
      while (targetSelector && !(r = findElement(targetSelector, $parent))) {
        targetSelector = selector[++i];
      }
    } else {
      if (!selector.subSelector) {
        r = $parent
          ? $parent.querySelector(selector.selector)
          : $q(selector.selector);
      } else if (selector.isIframe) {
        const $iframeDoc = getIframeContext(selector, $parent);
        r = $iframeDoc?.querySelector(selector.subSelector) ?? null;
      } else {
        r = findElementByKeyWord(selector, $parent);
      }
      if (selector.closest && r) {
        r = r.closest(selector.closest);
      }
      // recursive
      if (r && selector.nextSelector) {
        const nextSelector = selector.nextSelector;
        r = findElement(nextSelector, r);
      }
    }
  }
  return r;
}

export function findAllElement(
  selector: SelectorInput,
  $parent?: QueryContext
): Element[] {
  let res: Element[] = [];
  if (selector instanceof Array) {
    let i = 0;
    let targetSelector = selector[i];
    while (targetSelector) {
      const arr = findAllElement(targetSelector, $parent);
      if (arr.length) {
        res.push(...arr);
        break;
      }
      targetSelector = selector[++i];
    }
  } else {
    // 没有下一步的选择器
    if (!selector.nextSelector) {
      // 没子选择器
      if (!selector.subSelector) {
        res = Array.from(
          $parent
            ? $parent.querySelectorAll(selector.selector)
            : $qa(selector.selector)
        );
      } else if (selector.isIframe) {
        const $iframeDoc = getIframeContext(selector, $parent);
        res = Array.from($iframeDoc?.querySelectorAll(selector.subSelector) ?? []);
      } else {
        $parent = $parent ? $parent.querySelector(selector.selector) : $q(selector.selector);
        if (!$parent) return res;
        res = contains(selector.subSelector, selector.keyWord, $parent);
        if (selector.sibling) {
          res = res.map(($t) => $t.nextElementSibling).filter(isElement);
        }
      }
      // closest
      if (selector.closest) {
        res = res.map((r) => r.closest(selector.closest)).filter(isElement);
      }
    } else {
      // 有下一步的选择器时，selector 是用来定位父节点的
      const localSel: Selector = { ...selector };
      delete localSel.nextSelector;
      const parents = findAllElement(localSel, $parent);
      res = parents.flatMap(($p) => findAllElement(selector.nextSelector, $p));
    }
  }

  return res;
}

/**
 * 下载内容
 * https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 * @example
 * download(csvContent, 'dowload.csv', 'text/csv;encoding:utf-8');
 * BOM: data:text/csv;charset=utf-8,\uFEFF
 * @param content 内容
 * @param fileName 文件名
 * @param mimeType 文件类型
 */
export function downloadFile(
  content: BlobPart | BlobPart[],
  fileName: string,
  mimeType: string = 'application/octet-stream'
) {
  const a = document.createElement('a');
  const objectUrl = URL.createObjectURL(
    new Blob(Array.isArray(content) ? content : [content], {
      type: mimeType,
    })
  );
  a.href = objectUrl;
  a.style.display = 'none';
  a.setAttribute('download', fileName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

/**
 * @param {String} HTML 字符串
 * @return {Element}
 */
export function htmlToElement<E extends Element = Element>(html: string): E {
  const template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  const firstElement = template.content.firstElementChild;
  if (!firstElement) {
    throw new Error('htmlToElement requires a root element');
  }
  return firstElement as E;
}

export function createFetchDataIframe(): HTMLIFrameElement {
  const iframeId = 'e-userjs-fetch-data';
  let $iframe = document.querySelector<HTMLIFrameElement>(`#${iframeId}`);
  if (!$iframe) {
    $iframe = document.createElement('iframe');
    $iframe.setAttribute(
      'sandbox',
      'allow-forms allow-same-origin allow-scripts'
    );
    $iframe.style.display = 'none';
    $iframe.id = iframeId;
    document.body.appendChild($iframe);
  }
  return $iframe;
}

/**
 * 载入 iframe
 * @param $iframe iframe DOM
 * @param src iframe URL
 * @param TIMEOUT time out
 */
export function loadIframe(
  $iframe: HTMLIFrameElement,
  src: string,
  TIMEOUT = 10000
) {
  return new Promise((resolve, reject) => {
    $iframe.src = src;
    const timer = setTimeout(() => {
      $iframe.onload = undefined;
      reject(new Error('iframe timeout'));
    }, TIMEOUT);
    $iframe.onload = () => {
      clearTimeout(timer);
      $iframe.onload = null;
      resolve(undefined);
    };
  });
}

export function genAnonymousLinkText(url: string, text: string): string {
  return `<a
      target="_blank"
      href="${url}"
      rel="noopener noreferrer nofollow">
      ${text}</a>
    `;
}

export function addHTMLBase(html: string, url: string): string {
  if (html.match(/<base.+>/)) {
    return html;
  }
  const obj = new URL(url);
  return html.replace('</head>', `<base href="${obj.origin}"></head>`);
}
