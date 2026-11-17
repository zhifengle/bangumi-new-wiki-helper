import type { Selector, SelectorInput } from '../../interface/wiki';
import { findElement } from '../../utils/domUtils';
import { toTextPatterns } from '../../utils/textPattern';
import type { TextPattern } from '../../interface/textPattern';
import type { WikiExtractRoot } from './context';

export type SelectorMatch = {
  element: Element;
  selector: Selector;
};

export type SelectorAttempt = {
  rule: string;
  result: 'matched' | 'missed' | 'error';
  node?: string;
};

export type SelectorCheck = {
  name: string;
  scope: '页面' | '局部节点';
  result: 'matched' | 'missed' | 'empty' | 'error';
  attempts: SelectorAttempt[];
  error?: string;
};

export type ReportSelectorCheck = (check: SelectorCheck) => void;

export function createSelectorCheck(
  name: string,
  root?: WikiExtractRoot
): SelectorCheck {
  return {
    name,
    scope: root?.nodeType === 1 ? '局部节点' : '页面',
    result: 'missed',
    attempts: [],
  };
}

export function resolveSelectorMatch(
  selector: SelectorInput,
  root?: WikiExtractRoot,
  attempts?: SelectorAttempt[]
): SelectorMatch | undefined {
  if (selector instanceof Array) {
    for (const candidate of selector) {
      const match = resolveSelectorMatch(candidate, root, attempts);
      if (match) {
        return match;
      }
    }
    return;
  }

  const attempt: SelectorAttempt | undefined = attempts && {
    rule: JSON.stringify(selector, (_key, value) =>
      value instanceof RegExp ? String(value) : value
    ),
    result: 'error',
  };
  if (attempt && attempts) attempts.push(attempt);
  const element = findElement(selector, root);
  if (attempt) {
    attempt.result = element ? 'matched' : 'missed';
    if (element) {
      const id = element.id ? `#${element.id}` : '';
      const classes = [...element.classList].slice(0, 3).map((name) => `.${name}`);
      attempt.node = [element.localName, id, ...classes].join('').slice(0, 160);
    }
  }
  if (!element) {
    return;
  }

  return {
    element,
    selector,
  };
}

export function getSelectorKeyWords(selector: Selector): TextPattern[] {
  return toTextPatterns(selector.keyWord);
}
