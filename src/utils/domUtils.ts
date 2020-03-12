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
