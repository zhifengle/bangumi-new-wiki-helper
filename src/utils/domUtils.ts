import {Selector} from "../interface/wiki";

/**
 * 为页面添加样式
 * @param style
 */
export function addStyle(style: string) {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
};

/**
 * 获取节点文本
 * @param elem
 */
export function getText(elem: HTMLElement): string {
  if (!elem) return '';
  return elem.textContent || elem.innerText || "";
}

export function getInnerText(elem: HTMLElement): string {
  if (!elem) return '';
  return elem.innerText || elem.textContent || "";
}

/**
 * dollar 选择单个
 * @param {string} selector
 */
export function $q<E extends Element = Element>(selector: string): E | null {
  if (window._parsedEl) {
    return window._parsedEl.querySelector(selector)
  }
  return document.querySelector(selector);
}

/**
 * dollar 选择所有元素
 * @param {string} selector
 */
export function $qa<E extends Element>(selector: string): NodeListOf<E> {
  if (window._parsedEl) {
    return window._parsedEl.querySelectorAll(selector)
  }
  return document.querySelectorAll(selector);
}

/**
 * 插入自执行的函数的脚本
 * @param fn 回调函数
 * @param data 数据
 */
export function injectScript(fn: Function, data: Object) {
  const script = document.createElement("script");
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
  $parent: HTMLElement
): Element[] {
  let elements;
  if ($parent) {
    elements = $parent.querySelectorAll(selector);
  } else {
    elements = $qa(selector);
  }
  let t: string;
  if (typeof text === "string") {
    t = text;
  } else {
    t = text.join("|");
  }
  return [].filter.call(elements, function (element: HTMLElement) {
    return new RegExp(t).test(getText(element));
  });
}

function findElementByKeyWord(selector: Selector): Element {
  let res: Element = null;
  const targets = contains(selector.subSelector, selector.keyWord, $q(selector.selector));
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

export function findElement(selector: Selector | Selector[]): Element | null {
  let r: Element | null = null;
  if (selector) {
    if (selector instanceof Array) {
      let i = 0;
      let targetSelector = selector[i];
      while (targetSelector && !(r = findElement(targetSelector))) {
        targetSelector = selector[++i];
      }
    } else {
      if (selector.isIframe) {
        const $iframeDoc: Document = ($q(selector.selector) as HTMLIFrameElement).contentDocument;
        r = $iframeDoc.querySelector(selector.subSelector)
      } else if (!selector.subSelector) {
        r = $q(selector.selector);
      } else {
        r = findElementByKeyWord(selector);
      }
    }
  }
  return r;
}
