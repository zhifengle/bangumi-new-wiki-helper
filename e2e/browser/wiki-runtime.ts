import type { WikiPageContext } from '../../src/sites/core/context';
import type { SingleInfo } from '../../src/interface/subjectInfo';

type Extractor = () => Promise<SingleInfo[]>;

type RuntimeKind = 'subject' | 'character' | 'person';

type RuntimeState = {
  pageContext: WikiPageContext;
  registeredKinds: Set<RuntimeKind>;
  extractSubject?: Extractor;
  extractCharacter?: Extractor;
  extractPerson?: Extractor;
};

declare global {
  interface Window {
    __BNWH_E2E__?: {
      extractSubject: () => Promise<SingleInfo[]>;
      extractCharacter: () => Promise<SingleInfo[]>;
      extractPerson: () => Promise<SingleInfo[]>;
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
  const extractors: Record<RuntimeKind, Extractor | undefined> = {
    subject: state.extractSubject,
    character: state.extractCharacter,
    person: state.extractPerson,
  };
  const extractor = extractors[kind];
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
  extractPerson() {
    return getExtractor('person')();
  },
  registeredKinds() {
    return Array.from(state.registeredKinds);
  },
  reset() {
    state.registeredKinds.clear();
    state.extractSubject = undefined;
    state.extractCharacter = undefined;
    state.extractPerson = undefined;
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

export function registerPersonRuntime(extractor: Extractor) {
  state.extractPerson = extractor;
  state.registeredKinds.add('person');
}
