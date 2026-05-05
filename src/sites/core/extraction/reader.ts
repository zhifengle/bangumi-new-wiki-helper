import { getImageDataByURL } from '../../../utils/dealImage';
import { getInnerText, getText } from '../../../utils/domUtils';
import type { ReaderSpec, SourceContext, SourceResult, WikiValue } from './types';

export type CoverRefererPolicy = 'sourceUrl';

export type CoverRefererResolver = (
  context: SourceContext,
  imageUrl: string
) => string | undefined;

export type CoverReaderOptions = {
  attr?: string;
  referer?: CoverRefererPolicy | CoverRefererResolver;
};

function firstElement(source: SourceResult): Element | undefined {
  return Array.isArray(source) ? source[0] : source;
}

function elements(source: SourceResult): Element[] {
  return Array.isArray(source) ? source : source ? [source] : [];
}

function resolveUrl(url: string, context: SourceContext): string {
  const base = context.sourceUrl || (typeof location === 'undefined' ? '' : location.href);
  if (!url || /^https?:/.test(url) || !base) return url;
  return new URL(url, base).href;
}

export function text(options: { mode?: 'textContent' | 'rendered'; join?: string } = {}): ReaderSpec {
  return {
    read(source: SourceResult): WikiValue {
      const values = elements(source).map((element) => {
        if (options.mode === 'rendered' && element instanceof HTMLElement) {
          return getInnerText(element);
        }
        return getText(element);
      });
      return values.join(options.join ?? '\n');
    },
  };
}

export function attr(name: string): ReaderSpec {
  return {
    read(source: SourceResult): WikiValue {
      return firstElement(source)?.getAttribute(name) ?? '';
    },
  };
}

function resolveCoverReferer(
  policy: CoverReaderOptions['referer'],
  context: SourceContext,
  imageUrl: string
): string | undefined {
  if (typeof policy === 'function') {
    return policy(context, imageUrl);
  }
  if (policy === 'sourceUrl') {
    return context.sourceUrl;
  }
  return undefined;
}

export function cover(options: CoverReaderOptions = {}): ReaderSpec {
  return {
    async read(source: SourceResult, context: SourceContext): Promise<WikiValue> {
      const element = firstElement(source);
      if (!element) return undefined;
      const attrName = options.attr;
      let url = attrName ? element.getAttribute(attrName) ?? '' : '';
      if (!url && element instanceof HTMLAnchorElement) {
        url = element.getAttribute('href') || element.href || '';
      }
      if (!url && element instanceof HTMLImageElement) {
        url = element.getAttribute('data-src') || element.getAttribute('src') || element.src || '';
      }
      if (!url && element instanceof HTMLMetaElement) {
        url = element.content;
      }
      if (!url) return undefined;

      url = resolveUrl(url, context);
      let dataUrl = url;
      const referer = resolveCoverReferer(options.referer, context, url);
      try {
        dataUrl = await getImageDataByURL(url, {
          headers: referer ? { Referer: referer } : undefined,
        });
      } catch (error) {}
      return {
        url,
        dataUrl,
      };
    },
  };
}

export function list(itemReader: ReaderSpec = text()): ReaderSpec {
  return {
    async read(source: SourceResult, context: SourceContext): Promise<WikiValue> {
      const values: string[] = [];
      for (const element of elements(source)) {
        const value = await itemReader.read(element, context);
        if (typeof value === 'string' && value) {
          values.push(value);
        }
      }
      return values;
    },
  };
}

export function customReader(read: ReaderSpec['read']): ReaderSpec {
  return { read };
}
