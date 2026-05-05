import type { TextPatternInput } from '../../../interface/textPattern';
import {
  getTextPatternSource,
  isTextPattern,
  replaceTextPatterns,
} from '../../../utils/textPattern';
import type { CleanSpec, WikiValue } from './types';

type CleanOp = (value: string) => string;

function createKeywordPatterns(input: TextPatternInput): RegExp[] {
  const patterns = Array.isArray(input) ? input : [input];
  return patterns.filter(isTextPattern).map((pattern) => {
    if (pattern instanceof RegExp) {
      const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
      return new RegExp(`${pattern.source}\\s*?(:|：)?`, flags);
    }
    return new RegExp(`${getTextPatternSource(pattern)}\\s*?(:|：)?`, 'g');
  });
}

function cleanWith(ops: CleanOp[]): CleanSpec {
  return {
    apply(value: WikiValue): WikiValue {
      if (typeof value !== 'string') return value;
      return ops.reduce((current, op) => op(current), value);
    },
  };
}

export function strip(input: TextPatternInput): CleanOp {
  return (value) => replaceTextPatterns(value, createKeywordPatterns(input));
}

export function trim(): CleanOp {
  return (value) => value.trim();
}

export function trimAllSpace(): CleanOp {
  return (value) => value.trim().replace(/\s/g, '');
}

export function removeParenthesis(): CleanOp {
  return (value) => replaceTextPatterns(value.trim(), [/\(.*?\)/, /（.*?）/]);
}

export function removeParenthesisExceptNumber(): CleanOp {
  return (value) =>
    replaceTextPatterns(value.trim(), [/\([^\d]*?\)/, /（[^\d]*?）/]);
}

export function removeLabel(): CleanOp {
  return (value) => value.trim().replace(/[^\d:]+?(:|：)/, '').trim();
}

export const cleanText = {
  none(): false {
    return false;
  },
  chain(ops: CleanOp[]): CleanSpec {
    return cleanWith(ops);
  },
  standard(...extraOps: CleanOp[]): CleanSpec {
    return cleanWith([
      removeParenthesis(),
      ...extraOps,
      removeLabel(),
      trim(),
    ]);
  },
  preserve(): CleanSpec {
    return cleanWith([trim()]);
  },
  trim(): CleanSpec {
    return cleanWith([trim()]);
  },
};
