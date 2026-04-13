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
