import type { Selector, SelectorInput } from '../../interface/wiki';
import { findElement } from '../../utils/domUtils';
import { toTextPatterns } from '../../utils/textPattern';
import type { TextPattern } from '../../interface/textPattern';
import type { WikiExtractRoot } from './context';

export type SelectorMatch = {
  element: Element;
  selector: Selector;
};

export function resolveSelectorMatch(
  selector: SelectorInput,
  root?: WikiExtractRoot
): SelectorMatch | undefined {
  if (selector instanceof Array) {
    for (const candidate of selector) {
      const match = resolveSelectorMatch(candidate, root);
      if (match) {
        return match;
      }
    }
    return;
  }

  const element = findElement(selector, root);
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
