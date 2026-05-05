import { dealDate } from '../../../utils/utils';
import type { ParseSpec, WikiValue } from './types';

export function date(options: { format?: (value: string) => string } = {}): ParseSpec {
  return {
    parse(value: WikiValue): WikiValue {
      if (typeof value !== 'string') return value;
      const text = value.trim();
      if (!text) return '';
      return options.format ? options.format(text) : dealDate(text);
    },
  };
}

export function dateFromFirstMatch(): ParseSpec {
  const dateParser = date();
  const datePattern =
    /\d{4}年\d{1,2}月(?:\d{1,2}日?)?|\d{4}[/-]\d{1,2}(?:[/-]\d{1,2})?/;
  return {
    parse(value: WikiValue): WikiValue {
      if (typeof value !== 'string') return value;
      const match = value.match(datePattern);
      return match ? dateParser.parse(match[0]) : '';
    },
  };
}

export function dateRangeStart(separator: RegExp = /[–—]/): ParseSpec {
  const dateParser = date();
  return {
    parse(value: WikiValue): WikiValue {
      if (typeof value !== 'string') return value;
      const [start] = value.split(separator);
      return dateParser.parse(start ?? value);
    },
  };
}

export function queryParam(name: string): ParseSpec {
  return {
    parse(value: WikiValue): WikiValue {
      if (typeof value !== 'string') return value;
      if (!value) return '';
      try {
        return new URL(value).searchParams.get(name) ?? '';
      } catch {
        return '';
      }
    },
  };
}

export function number(options: {
  rejectIfIncludes?: string | string[];
  maxInputLength?: number;
} = {}): ParseSpec {
  return {
    parse(value: WikiValue): WikiValue {
      if (typeof value !== 'string') return value;
      const rejectPatterns = Array.isArray(options.rejectIfIncludes)
        ? options.rejectIfIncludes
        : options.rejectIfIncludes
          ? [options.rejectIfIncludes]
          : [];
      if (
        rejectPatterns.some((pattern) => value.includes(pattern)) ||
        (options.maxInputLength !== undefined && value.length > options.maxInputLength)
      ) {
        return '';
      }
      return value.match(/\d+/)?.[0] ?? '';
    },
  };
}
