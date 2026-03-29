import type { TextPattern, TextPatternInput } from '../interface/textPattern';

export function isTextPattern(value: unknown): value is TextPattern {
  return typeof value === 'string' || value instanceof RegExp;
}

export function toTextPatterns(input?: TextPatternInput): TextPattern[] {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input.filter(isTextPattern);
  }
  return isTextPattern(input) ? [input] : [];
}

export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mergeFlags(patternFlags: string, extraFlags = ''): string {
  return Array.from(new Set(`${patternFlags}${extraFlags}`.split(''))).join('');
}

export function getTextPatternSource(pattern: TextPattern): string {
  return pattern instanceof RegExp ? pattern.source : escapeRegExp(pattern);
}

export function toRegExp(pattern: TextPattern, extraFlags = ''): RegExp {
  if (pattern instanceof RegExp) {
    return new RegExp(pattern.source, mergeFlags(pattern.flags, extraFlags));
  }
  return new RegExp(getTextPatternSource(pattern), extraFlags);
}

export function replaceTextPatterns(
  text: string,
  patterns: TextPattern[],
  extraFlags = 'g'
): string {
  return patterns.reduce<string>((current, pattern) => {
    return current.replace(toRegExp(pattern, extraFlags), '');
  }, text);
}

export function matchesTextPatterns(
  text: string,
  patterns: TextPattern[],
  extraFlags = ''
): boolean {
  return patterns.some((pattern) => toRegExp(pattern, extraFlags).test(text));
}

export function createStartsWithPattern(text: string): RegExp {
  return new RegExp(`^${escapeRegExp(text)}`);
}
