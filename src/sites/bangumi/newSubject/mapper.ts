import { getStringValue, SingleInfo } from '../../../interface/subjectInfo';
import { dealDate } from '../../../utils/utils';

function hasCategory(info: SingleInfo, category: string) {
  if (info.category === category) {
    return true;
  }
  return (
    info.category &&
    info.category.includes(',') &&
    info.category.split(',').includes(category)
  );
}

// ─── 常量 ────────────────────────────────────────────────────────────────────

const MULTI_VALUE_FIELDS = new Set(['website']);

const BLOCK_FIELDS = new Set(['别名', '链接', '平台']);

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isEmptyFieldLine(line: string, fieldName: string): boolean {
  return new RegExp(`^\\|\\s*${escapeRegExp(fieldName)}\\s*=\\s*$`).test(
    line.split('\n')[0].trim()
  );
}

function isBlockStartLine(line: string, fieldName?: string): boolean {
  const namePattern = fieldName ? escapeRegExp(fieldName) : '.+?';
  return new RegExp(`^\\|\\s*${namePattern}\\s*=\\s*\\{\\s*$`).test(
    line.split('\n')[0].trim()
  );
}

function extractFieldName(line: string): string | null {
  const m = line.match(/(?:\||\[)(.+?)([|=])/);
  return m && m.length >= 2 ? m[1].trim() : null;
}

function ensureBlockSyntax(arr: string[], fieldName: string): string[] {
  const blockMarker = `|${fieldName}={`;

  const existingBlockIdx = arr.findIndex((v) => isBlockStartLine(v, fieldName));
  if (existingBlockIdx > -1) {
    const result = [...arr];
    result[existingBlockIdx] = blockMarker;
    return result;
  }

  const idx = arr.findIndex((v) => isEmptyFieldLine(v, fieldName));
  if (idx > -1) {
    const result = [...arr];
    result[idx] = blockMarker;
    return [...result.slice(0, idx + 1), '}', ...result.slice(idx + 1)];
  }

  return [...arr.slice(0, -1), blockMarker, '}', ...arr.slice(-1)];
}

function normaliseValue(info: SingleInfo): string {
  let d = getStringValue(info.value);
  if (info.category === 'date') d = dealDate(d);
  if (info.category === 'ISBN') d = d.replace(/-/g, '');
  return d;
}

function mergeInfoIntoLine(
  line: string,
  info: SingleInfo,
  originValue: string
): string | null {
  const n = extractFieldName(line);
  if (n !== info.name) return null;

  const d = normaliseValue(info);

  // [英文名|] 格式
  if (/\[.+\|\]/.test(line)) {
    return line.replace(']', '') + d + ']';
  }

  // |平台={ 块格式，避免重复插入
  if (isBlockStartLine(line, info.name)) {
    const infoValue = getStringValue(info.value);
    if (!originValue.includes(`[${infoValue}]`) && !line.includes(`[${infoValue}]`)) {
      return `${line}\n[${infoValue}]`;
    }
    return line;
  }

  // 普通 |字段=值 格式
  return line.replace(/\s*=.*/, '=') + d;
}

function applyBlockFormats(arr: string[], infoArr: SingleInfo[]): string[] {
  let result = [...arr];

  // 1. 模板规范字段（别名、链接、平台等）
  for (const fieldName of BLOCK_FIELDS) {
    const hasInfoForField = infoArr.some((info) => info.name === fieldName);
    if (
      hasInfoForField &&
      result.some(
        (v) => isEmptyFieldLine(v, fieldName) || isBlockStartLine(v, fieldName)
      )
    ) {
      result = ensureBlockSyntax(result, fieldName);
    }
  }

  // 2. 允许多值的字段（website 等）
  for (const fieldName of MULTI_VALUE_FIELDS) {
    const infos = infoArr.filter((i) => i.name === fieldName);
    if (infos.length > 1) {
      result = ensureBlockSyntax(result, fieldName);
    }
  }

  // 3. 标记为 listItem 的字段
  for (const info of infoArr) {
    if (hasCategory(info, 'listItem')) {
      result = ensureBlockSyntax(result, info.name);
    }
  }

  return result;
}

function reorderAuthorBeforePress(lines: string[]): string[] | null {
  let pressIdx = -1;
  let authorIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/\|(\s*)出版社(\s*)=/.test(lines[i])) pressIdx = i;
    if (/作者/.test(lines[i])) authorIdx = i;
  }

  if (pressIdx === -1 || authorIdx === -1 || authorIdx <= pressIdx) return null;

  const result = [...lines];
  const [author] = result.splice(authorIdx, 1);
  result.splice(pressIdx, 0, author);
  return result;
}

// ─── 主函数 ───────────────────────────────────────────────────────────────────

export function convertInfoValue(
  originValue: string,
  infoArr: SingleInfo[]
): string {
  // 1. 初始化行数组
  let arr = originValue
    .trim()
    .split('\n')
    .filter(Boolean);

  // 2. 统一处理块格式字段
  arr = applyBlockFormats(arr, infoArr);

  // 3. 将 infoArr 中的值合并进 arr
  const unmatchedLines: string[] = [];

  for (const info of infoArr) {
    let matched = false;

    for (let i = 0; i < arr.length; i++) {
      const updated = mergeInfoIntoLine(arr[i], info, originValue);
      if (updated !== null) {
        arr[i] = updated;
        matched = true;
        break;
      }
    }

    // 未匹配的字段（asin 除外）追加到末尾
    if (!matched && info.name && !['asin', 'ASIN'].includes(info.name)) {
      unmatchedLines.push(`|${info.name}=${getStringValue(info.value)}`);
    }
  }

  // 4. 移除末尾的 }}
  arr.pop();

  // 5. 组合最终行数组
  const finalLines = [...arr, ...unmatchedLines, '}}'];

  // 6. animanga/Book：作者排在出版社之前
  if (/animanga/.test(arr[0])) {
    const reordered = reorderAuthorBeforePress(finalLines);
    if (reordered) return reordered.join('\n');
  }

  return finalLines.join('\n');
}
