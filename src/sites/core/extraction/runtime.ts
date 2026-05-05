import type { SingleInfo } from '../../../interface/subjectInfo';
import { cleanText } from './clean';
import { text } from './reader';
import { locateSource } from './source';
import type {
  CleanSpec,
  FieldContext,
  FieldPlan,
  FieldSpec,
  FieldTransform,
  ParseSpec,
  ResolvedEmitSpec,
  SourceContext,
  WikiValue,
} from './types';

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function resolveClean(field: FieldSpec): CleanSpec | false {
  if (field.clean !== undefined) return field.clean;
  if (field.kind?.clean !== undefined) return field.kind.clean;
  return cleanText.standard();
}

function resolveReader(field: FieldSpec) {
  return field.read ?? field.kind?.read ?? text();
}

function resolveParsers(field: FieldSpec): ParseSpec[] {
  return asArray(field.parse ?? field.kind?.parse);
}

function resolveTransforms(field: FieldSpec): FieldTransform[] {
  return asArray(field.transform ?? field.kind?.transform);
}

function resolveEmit(field: FieldSpec): ResolvedEmitSpec {
  return {
    empty: 'skip',
    ...field.kind?.emit,
    ...field.emit,
  };
}

export function compileFieldPlan(field: FieldSpec): FieldPlan {
  return {
    field,
    name: field.name,
    source: field.source,
    reader: resolveReader(field),
    cleaner: resolveClean(field),
    parsers: resolveParsers(field),
    transforms: resolveTransforms(field),
    emit: resolveEmit(field),
  };
}

export function compileFieldPlans(fields: FieldSpec[]): FieldPlan[] {
  return fields.map(compileFieldPlan);
}

function isEmptyValue(value: WikiValue): boolean {
  return (
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function emitField(plan: FieldPlan, value: WikiValue): SingleInfo[] {
  const emit = plan.emit;
  let nextValue = value;

  if (nextValue === undefined && emit.empty === 'use-default') {
    nextValue =
      typeof emit.defaultValue === 'function'
        ? emit.defaultValue()
        : emit.defaultValue;
  }

  if (nextValue === null && emit.empty !== 'keep-null') {
    return [];
  }

  if (isEmptyValue(nextValue) && emit.empty !== 'keep-empty-string') {
    return [];
  }

  return [
    {
      name: emit.name ?? plan.name,
      value: nextValue,
      category: emit.category,
    },
  ];
}

export async function executeFieldPlan(
  plan: FieldPlan,
  context: SourceContext
): Promise<SingleInfo[]> {
  const sourceResult = locateSource(plan.source, context);
  if (!sourceResult || (Array.isArray(sourceResult) && !sourceResult.length)) {
    return [];
  }

  const fieldContext: FieldContext = {
    ...context,
    field: plan.field,
  };
  let value = await plan.reader.read(sourceResult, context);
  if (plan.cleaner) {
    value = plan.cleaner.apply(value);
  }
  for (const parser of plan.parsers) {
    value = parser.parse(value);
  }
  for (const transform of plan.transforms) {
    value = await transform(value, fieldContext);
  }
  return emitField(plan, value);
}

export async function extractField(
  field: FieldSpec,
  context: SourceContext
): Promise<SingleInfo[]> {
  return executeFieldPlan(compileFieldPlan(field), context);
}

export async function extractFields(
  fields: FieldSpec[],
  context: SourceContext
): Promise<SingleInfo[]> {
  const plans = compileFieldPlans(fields);
  const results = await Promise.allSettled(
    plans.map((plan) => executeFieldPlan(plan, context))
  );

  return results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    console.error(`[extract] failed to get wiki item: ${plans[index]?.name}`, result.reason);
    return [];
  });
}
