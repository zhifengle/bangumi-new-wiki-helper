import { cleanText } from './clean';
import { cover, text } from './reader';
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
  cover(): FieldKind {
    return {
      read: cover(),
      clean: false,
    };
  },
};
