import { cleanText } from './clean';
import { cover, text } from './reader';
import type { CoverReaderOptions } from './reader';
import type { FieldKind } from './types';

export const fieldKind = {
  text(): FieldKind {
    return {
      read: text(),
      clean: cleanText.standard(),
    };
  },
  preservedText(): FieldKind {
    return {
      read: text({ mode: 'rendered' }),
      clean: cleanText.preserve(),
    };
  },
  cover(options?: CoverReaderOptions): FieldKind {
    return {
      read: cover(options),
      clean: false,
    };
  },
};
