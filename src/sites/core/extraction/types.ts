import type { SingleInfo, SingleInfoValue } from '../../../interface/subjectInfo';
import type { TextPatternInput } from '../../../interface/textPattern';
import type { SubjectModelKey } from '../../../interface/wiki';
import type { WikiExtractRoot } from '../context';

export type MaybePromise<T> = T | Promise<T>;
export type WikiValue = SingleInfoValue;
export type SourceRoot = Document | Element;

export type SourceContext = {
  root?: WikiExtractRoot;
  site: SubjectModelKey;
  sourceUrl?: string;
  imageReferer?: string;
};

export type DomTraversalStep =
  | { op: 'find'; selector: string }
  | { op: 'hasText'; pattern: TextPatternInput }
  | { op: 'next'; selector?: string }
  | { op: 'closest'; selector: string }
  | { op: 'scope'; source: SourceSpec };

export interface DomSourceSpec {
  type: 'dom';
  selector: string;
  steps: DomTraversalStep[];
  all?: boolean;
  iframe?: boolean;
  find(selector: string): DomSourceSpec;
  hasText(pattern: TextPatternInput): DomSourceSpec;
  next(selector?: string): DomSourceSpec;
  closest(selector: string): DomSourceSpec;
  scope(source: SourceSpec): DomSourceSpec;
  allItems(): DomSourceSpec;
  iframeBody(): DomSourceSpec;
}

export interface FirstOfSourceSpec {
  type: 'firstOf';
  candidates: SourceSpec[];
}

export interface MetaSourceSpec {
  type: 'meta';
  name?: string;
  property?: string;
  itemprop?: string;
}

export type SourceSpec = DomSourceSpec | FirstOfSourceSpec | MetaSourceSpec;
export type SourceResult = Element | Element[] | undefined;

export type ReaderSpec = {
  read(source: SourceResult, context: SourceContext): MaybePromise<WikiValue>;
};

export type CleanSpec = {
  apply(value: WikiValue): WikiValue;
};

export type ParseSpec = {
  parse(value: WikiValue): WikiValue;
};

export type FieldTransform = (
  value: WikiValue,
  context: FieldContext
) => MaybePromise<WikiValue>;

export type EmptyPolicy =
  | 'skip'
  | 'keep-empty-string'
  | 'keep-null'
  | 'use-default';

export interface EmitSpec {
  name?: string;
  category?: string;
  empty?: EmptyPolicy;
  defaultValue?: WikiValue | (() => WikiValue);
}

export interface FieldKind {
  read?: ReaderSpec;
  clean?: CleanSpec | false;
  parse?: ParseSpec | ParseSpec[];
  transform?: FieldTransform | FieldTransform[];
  emit?: EmitSpec;
}

export interface FieldSpec {
  name: string;
  source: SourceSpec;
  read?: ReaderSpec;
  clean?: CleanSpec | false;
  parse?: ParseSpec | ParseSpec[];
  transform?: FieldTransform | FieldTransform[];
  emit?: EmitSpec;
  kind?: FieldKind;
}

export type FieldContext = SourceContext & {
  field: FieldSpec;
};

export type ResolvedEmitSpec = Required<Pick<EmitSpec, 'empty'>> & EmitSpec;

export interface FieldPlan {
  field: FieldSpec;
  name: string;
  source: SourceSpec;
  reader: ReaderSpec;
  cleaner: CleanSpec | false;
  parsers: ParseSpec[];
  transforms: FieldTransform[];
  emit: ResolvedEmitSpec;
}

export type FinalizeContext =
  | (SourceContext & { kind: 'subject' })
  | (SourceContext & { kind: 'character'; root: Element | Document });

export type FinalizeHook = (
  items: SingleInfo[],
  context: FinalizeContext
) => MaybePromise<SingleInfo[]>;
