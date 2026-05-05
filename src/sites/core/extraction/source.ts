import type { TextPatternInput } from '../../../interface/textPattern';
import { matchesTextPatterns, toTextPatterns } from '../../../utils/textPattern';
import { getText } from '../../../utils/domUtils';
import type {
  DomSourceSpec,
  DomTraversalStep,
  FirstOfSourceSpec,
  MetaSourceSpec,
  SourceContext,
  SourceResult,
  SourceSpec,
} from './types';

function cloneDomSource(source: DomSourceSpec, patch: Partial<DomSourceSpec>): DomSourceSpec {
  return createDomSource({
    ...source,
    ...patch,
    steps: patch.steps ?? source.steps,
  });
}

function createDomSource(input: Omit<DomSourceSpec, 'find' | 'hasText' | 'next' | 'closest' | 'scope' | 'allItems' | 'iframeBody'>): DomSourceSpec {
  const source = {
    ...input,
    find(selector: string) {
      return cloneDomSource(source, {
        steps: [...source.steps, { op: 'find', selector }],
      });
    },
    hasText(pattern: TextPatternInput) {
      return cloneDomSource(source, {
        steps: [...source.steps, { op: 'hasText', pattern }],
      });
    },
    next(selector?: string) {
      return cloneDomSource(source, {
        steps: [...source.steps, { op: 'next', selector }],
      });
    },
    closest(selector: string) {
      return cloneDomSource(source, {
        steps: [...source.steps, { op: 'closest', selector }],
      });
    },
    scope(nested: SourceSpec) {
      return cloneDomSource(source, {
        steps: [...source.steps, { op: 'scope', source: nested }],
      });
    },
    allItems() {
      return cloneDomSource(source, { all: true });
    },
    iframeBody() {
      return cloneDomSource(source, { iframe: true });
    },
  };
  return source;
}

export function dom(selector: string): DomSourceSpec {
  return createDomSource({
    type: 'dom',
    selector,
    steps: [],
  });
}

export function firstOf(candidates: SourceSpec[]): FirstOfSourceSpec {
  return {
    type: 'firstOf',
    candidates,
  };
}

export function meta(input: Omit<MetaSourceSpec, 'type'>): MetaSourceSpec {
  return {
    type: 'meta',
    ...input,
  };
}

function getRoot(context: SourceContext): ParentNode {
  return context.root ?? document;
}

function uniqueElements(elements: Element[]): Element[] {
  return elements.filter((element, index) => elements.indexOf(element) === index);
}

function queryAll(selector: string, root: ParentNode): Element[] {
  return Array.from(root.querySelectorAll(selector));
}

function matchesSelector(element: Element, selector?: string): boolean {
  return !selector || element.matches(selector);
}

function applyStep(elements: Element[], step: DomTraversalStep, context: SourceContext): Element[] {
  if (step.op === 'find') {
    return elements.flatMap((element) => queryAll(step.selector, element));
  }

  if (step.op === 'hasText') {
    const patterns = toTextPatterns(step.pattern);
    return elements.filter((element) =>
      matchesTextPatterns(getText(element), patterns, 'i')
    );
  }

  if (step.op === 'next') {
    return elements.flatMap((element) => {
      const sibling = element.nextElementSibling;
      if (!sibling || !matchesSelector(sibling, step.selector)) return [];
      return [sibling];
    });
  }

  if (step.op === 'closest') {
    return elements.flatMap((element) => {
      const target = element.closest(step.selector);
      return target ? [target] : [];
    });
  }

  return elements.flatMap((element) => {
    const result = locateSource(step.source, { ...context, root: element });
    return Array.isArray(result) ? result : result ? [result] : [];
  });
}

function locateDomSource(source: DomSourceSpec, context: SourceContext): SourceResult {
  let roots: ParentNode[] = [getRoot(context)];
  if (source.iframe) {
    roots = queryAll(source.selector, getRoot(context)).flatMap((element) => {
      if (element instanceof HTMLIFrameElement && element.contentDocument) {
        return [element.contentDocument];
      }
      return [];
    });
  }

  let elements = roots.flatMap((root) =>
    source.iframe ? queryAll('body', root) : queryAll(source.selector, root)
  );
  for (const step of source.steps) {
    elements = applyStep(elements, step, context);
  }

  elements = uniqueElements(elements);
  return source.all ? elements : elements[0];
}

function locateMetaSource(source: MetaSourceSpec, context: SourceContext): SourceResult {
  const root = getRoot(context);
  const selectors = [
    source.property ? `meta[property="${source.property}"]` : '',
    source.name ? `meta[name="${source.name}"]` : '',
    source.itemprop ? `meta[itemprop="${source.itemprop}"]` : '',
  ].filter(Boolean);
  for (const selector of selectors) {
    const element = root.querySelector(selector);
    if (element) return element;
  }
}

export function locateSource(source: SourceSpec, context: SourceContext): SourceResult {
  if (source.type === 'dom') {
    return locateDomSource(source, context);
  }

  if (source.type === 'meta') {
    return locateMetaSource(source, context);
  }

  for (const candidate of source.candidates) {
    const result = locateSource(candidate, context);
    if (Array.isArray(result) ? result.length : result) {
      return result;
    }
  }
}
