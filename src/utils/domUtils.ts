/**
 * 为页面添加样式
 * @param style
 */
export const addStyle = (style: string) => {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
};

function getText(elem: HTMLElement): string {
  return (elem.textContent || elem.innerText || '')
}
/**
 * dollar 选择单个
 * @param {string} selector
 */
export function $q(selector: string): HTMLElement {
  return document.querySelector(selector);
}

/**
 * dollar 选择所有元素
 * @param {string} selector
 */
export function $qa(selector: string): NodeList {
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
export function contains(selector: string, text: string | string[], $parent: HTMLElement) {
  let elements;
  if ($parent) {
    elements = $parent.querySelectorAll(selector);
  } else {
    elements = $qa(selector);
  }
  let t = text as any;
  if (Array.isArray(t)) {
    t = t.join('|');
  }
  return [].filter.call(elements, function (element: HTMLElement) {
    return new RegExp(t).test(getText(element));
  });
}

