import { Selector } from '../interface/wiki';

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
export function getText(elem: HTMLElement): string {
  if (!elem) return '';
  if (elem.tagName.toLowerCase() === 'meta') {
    return (elem as any).content;
  }
  if (elem.tagName.toLowerCase() === 'input') {
    return (elem as any).value;
  }
  return elem.textContent || elem.innerText || '';
}

export function getInnerText(elem: HTMLElement): string {
  if (!elem) return '';
  return elem.innerText || elem.textContent || '';
}

/**
 * dollar 选择单个
 * @param {string} selector
 */
export function $q<E extends Element = Element>(selector: string): E | null {
  if (window._parsedEl) {
    return window._parsedEl.querySelector(selector);
  }
  return document.querySelector(selector);
}

/**
 * dollar 选择所有元素
 * @param {string} selector
 */
export function $qa<E extends Element>(selector: string): NodeListOf<E> {
  if (window._parsedEl) {
    return window._parsedEl.querySelectorAll(selector);
  }
  return document.querySelectorAll(selector);
}

/**
 * 插入自执行的函数的脚本
 * @param fn 回调函数
 * @param data 数据
 */
export function injectScript(fn: Function, data: Object) {
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
  text: string | string[],
  $parent: Element
): Element[] {
  let elements;
  if ($parent) {
    elements = $parent.querySelectorAll(selector);
  } else {
    elements = $qa(selector);
  }
  let t: string;
  if (typeof text === 'string') {
    t = text;
  } else {
    t = text.join('|');
  }
  return [].filter.call(elements, function (element: HTMLElement) {
    return new RegExp(t, 'i').test(getText(element));
  });
}

function findElementByKeyWord(selector: Selector, $parent?: Element): Element {
  let res: Element = null;
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

export function findElement(
  selector: Selector | Selector[],
  $parent?: Element
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
        // iframe 暂时不支持 parent
        const $iframeDoc: Document = (
          $q(selector.selector) as HTMLIFrameElement
        )?.contentDocument;
        r = $iframeDoc?.querySelector(selector.subSelector);
      } else {
        r = findElementByKeyWord(selector, $parent);
      }
      if (selector.closest) {
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
  selector: Selector | Selector[],
  $parent?: Element
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
        const $iframeDoc: Document = (
          $q(selector.selector) as HTMLIFrameElement
        )?.contentDocument;
        res = Array.from($iframeDoc?.querySelectorAll(selector.subSelector));
      } else {
        if (selector.isIframe) {
          const $iframeDoc: Document = (
            $q(selector.selector) as HTMLIFrameElement
          )?.contentDocument;
          // iframe 时不需要 keyWord
          $parent = $iframeDoc?.querySelector(selector.subSelector);
        } else {
          $parent = $parent ? $parent : $q(selector.selector);
        }
        if (!$parent) return res;
        res = contains(selector.subSelector, selector.keyWord, $parent);
        if (selector.sibling) {
          res = res.map(($t) => $t.nextElementSibling);
        }
      }
      // closest
      if (selector.closest) {
        res = res.map((r) => r.closest(selector.closest));
      }
    } else {
      // 有下一步的选择器时，selector 是用来定位父节点的
      const localSel = { ...selector };
      delete localSel.nextSelector;
      const $p = findElement(localSel);
      if ($p) {
        res = findAllElement(selector.nextSelector, $p);
      }
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
  content: any,
  fileName: string,
  mimeType: string = 'application/octet-stream'
) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([content], {
      type: mimeType,
    })
  );
  a.style.display = 'none';
  a.setAttribute('download', fileName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * @param {String} HTML 字符串
 * @return {Element}
 */
export function htmlToElement(html: string) {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  // template.content.childNodes;
  return template.content.firstChild;
}

export function createFetchDataIframe(): HTMLIFrameElement {
  const iframeId = 'e-userjs-fetch-data';
  let $iframe = document.querySelector(`#${iframeId}`) as HTMLIFrameElement;
  if (!$iframe) {
    $iframe = document.createElement('iframe');
    $iframe.setAttribute(
      'sandbox',
      'allow-forms allow-same-origin allow-scripts'
    );
    // @ts-ignore
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
  TIMEOUT = 5000
) {
  return new Promise((resolve, reject) => {
    $iframe.src = src;
    let timer = setTimeout(() => {
      timer = null;
      $iframe.onload = undefined;
      reject('iframe timeout');
    }, TIMEOUT);
    $iframe.onload = () => {
      clearTimeout(timer);
      $iframe.onload = null;
      resolve(null);
    };
  });
}
