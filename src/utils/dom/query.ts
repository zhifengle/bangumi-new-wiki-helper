import type { TextPatternInput } from '../../interface/textPattern';
import { matchesTextPatterns, toTextPatterns } from '../textPattern';

export type QueryContext = ParentNode | null | undefined;

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
export function $q<E extends Element = Element>(
  selector: string,
  $parent?: QueryContext
): E | null {
  return ($parent ?? document).querySelector(selector);
}

/**
 * dollar 选择所有元素
 * @param {string} selector
 */
export function $qa<E extends Element>(
  selector: string,
  $parent?: QueryContext
): NodeListOf<E> {
  return ($parent ?? document).querySelectorAll(selector);
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
  const elements = Array.from($qa(selector, $parent));
  const patterns = toTextPatterns(text);
  if (!patterns.length) {
    return [];
  }
  return elements.filter((element) => {
    return matchesTextPatterns(getText(element), patterns, 'i');
  });
}
