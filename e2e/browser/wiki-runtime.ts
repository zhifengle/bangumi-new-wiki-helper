import type { WikiPageContext } from '../../src/sites/core/context';
import type { SingleInfo } from '../../src/interface/subjectInfo';

type Extractor = () => Promise<SingleInfo[]>;

type RuntimeKind = 'subject' | 'character';

type RuntimeState = {
  pageContext: WikiPageContext;
  registeredKinds: Set<RuntimeKind>;
  extractSubject?: Extractor;
  extractCharacter?: Extractor;
};

declare global {
  interface Window {
    __BNWH_E2E__?: {
      extractSubject: () => Promise<SingleInfo[]>;
      extractCharacter: () => Promise<SingleInfo[]>;
      registeredKinds: () => RuntimeKind[];
      reset: () => void;
      setPageContext: (pageContext: WikiPageContext) => void;
      getPageContext: () => WikiPageContext;
    };
  }
}

const state: RuntimeState = {
  pageContext: {},
  registeredKinds: new Set<RuntimeKind>(),
};

function getExtractor(kind: RuntimeKind): Extractor {
  const extractor =
    kind === 'subject' ? state.extractSubject : state.extractCharacter;
  if (!extractor) {
    throw new Error(`BNWH E2E ${kind} runtime is not registered`);
  }
  return extractor;
}

window.__BNWH_E2E__ = {
  extractSubject() {
    return getExtractor('subject')();
  },
  extractCharacter() {
    return getExtractor('character')();
  },
  registeredKinds() {
    return Array.from(state.registeredKinds);
  },
  reset() {
    state.registeredKinds.clear();
    state.extractSubject = undefined;
    state.extractCharacter = undefined;
  },
  setPageContext(pageContext) {
    state.pageContext = pageContext;
  },
  getPageContext() {
    return state.pageContext;
  },
};

export function registerSubjectRuntime(extractor: Extractor) {
  state.extractSubject = extractor;
  state.registeredKinds.add('subject');
}

export function registerCharacterRuntime(extractor: Extractor) {
  state.extractCharacter = extractor;
  state.registeredKinds.add('character');
}
