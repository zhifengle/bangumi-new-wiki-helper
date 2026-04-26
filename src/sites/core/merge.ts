import { getStringValue, SingleInfo } from '../../interface/subjectInfo';
import { IAuxPrefs } from '../../interface/types';

// ═══════════════════════════════════════════════════════
// 语言检测（纯函数，无副作用）
// ═══════════════════════════════════════════════════════

const JP_RE = /[\u3040-\u309F\u30A0-\u30FFー]/;
const CN_RE = /^[\u4e00-\u9fa5]+/;

const isJp = (s: string) => JP_RE.test(s);
const isCn = (s: string) => CN_RE.test(s) && !isJp(s);

// ═══════════════════════════════════════════════════════
// 合并策略类型
// ═══════════════════════════════════════════════════════

type MergeContext = {
  current: SingleInfo;   // 来自 infoList
  other: SingleInfo;     // 来自 otherInfoList
  auxPrefs: IAuxPrefs;
};

type MergeStrategy = (ctx: MergeContext) => SingleInfo[];

// ═══════════════════════════════════════════════════════
// 各字段合并策略
// ═══════════════════════════════════════════════════════

/** 优先偏好：直接取指定侧 */
const preferOriginStrategy: MergeStrategy = ({ current }) => [{ ...current }];
const preferTargetStrategy: MergeStrategy = ({ other }) => [{ ...other }];

/**
 * subject_title 策略
 *
 * 语言优先级：日文 > 中文 > 其他
 * 主标题 → 优先级最高的语言
 * 中文名 → 若有中文且不是主标题
 * 别名   → 剩余有值的字符串
 */
const subjectTitleStrategy: MergeStrategy = ({ current, other }) => {
  const cv = getStringValue(current.value);
  const ov = getStringValue(other.value);

  const titleObj: SingleInfo = { ...current };
  const cnName: SingleInfo = { name: '中文名', value: '' };
  const alias: SingleInfo = { name: '别名', value: '', category: 'alias' };

  const jpVal = isJp(cv) ? cv : isJp(ov) ? ov : '';
  const cnVal = isCn(cv) ? cv : isCn(ov) ? ov : '';

  if (jpVal) {
    // 日文作主标题
    titleObj.value = jpVal;
    if (cnVal) {
      // 中日：中文存 cnName
      cnName.value = cnVal;
    } else {
      // 只有日文：另一个存别名
      alias.value = jpVal === cv ? ov : cv;
    }
  } else if (cnVal) {
    // 只有中文：中文存 cnName，另一个作主标题
    cnName.value = cnVal;
    titleObj.value = cnVal === cv ? ov : cv;
  } else {
    // 都不是：取较长值
    titleObj.value = cv.length >= ov.length ? cv : ov;
  }

  return [titleObj, cnName, alias];
};

/** 保留原始值（游戏简介/开发/发行等不宜被覆盖的字段） */
const keepOriginStrategy: MergeStrategy = ({ current }) => [{ ...current }];

/** 默认策略：取较长值 */
const longerValueStrategy: MergeStrategy = ({ current, other }) => {
  const cv = getStringValue(current.value);
  const ov = getStringValue(other.value);
  return [{ ...current, ...other, value: cv.length >= ov.length ? cv : ov }];
};

// ═══════════════════════════════════════════════════════
// 策略选择器
// ═══════════════════════════════════════════════════════

const KEEP_ORIGIN_NAMES = new Set(['游戏简介', '开发', '发行']);

function selectStrategy(ctx: MergeContext): MergeStrategy {
  const { current, other, auxPrefs } = ctx;
  const { originNames, targetNames } = auxPrefs;

  // 偏好优先级最高
  if (
    originNames === 'all' ||
    (Array.isArray(originNames) && originNames.includes(current.name))
  ) {
    return preferOriginStrategy;
  }
  if (
    targetNames === 'all' ||
    (Array.isArray(targetNames) && targetNames.includes(other.name))
  ) {
    return preferTargetStrategy;
  }

  // 按字段特征选策略
  if (current.category === 'subject_title') return subjectTitleStrategy;
  if (KEEP_ORIGIN_NAMES.has(current.name)) return keepOriginStrategy;

  return longerValueStrategy;
}

// ═══════════════════════════════════════════════════════
// Step 1：分组归并 → [origin only | both | other only]
// ═══════════════════════════════════════════════════════

type GroupedField =
  | { kind: 'origin-only'; item: SingleInfo }
  | { kind: 'other-only'; item: SingleInfo }
  | { kind: 'both'; current: SingleInfo; other: SingleInfo };

/**
 * 多值字段（平台/别名）允许同名多条，其余字段 name 唯一匹配。
 * targetNames 中的字段以 other 侧为准，origin 侧跳过；
 * originNames 中的字段以 origin 侧为准，other 侧在 combineObj 内处理。
 */
function groupFields(
  infoList: SingleInfo[],
  otherInfoList: SingleInfo[],
  auxPrefs: IAuxPrefs
): GroupedField[] {
  const MULTI_FIELDS = new Set(['平台', '别名']);
  const { targetNames = [] } = auxPrefs;
  const targetNamesSet = new Set(
    Array.isArray(targetNames) ? targetNames : []
  );

  // 非多值字段建索引
  const otherIndex = new Map<string, SingleInfo>();

  for (const item of otherInfoList) {
    if (!MULTI_FIELDS.has(item.name) && !otherIndex.has(item.name)) {
      otherIndex.set(item.name, item);
    }
  }

  const groups: GroupedField[] = [];
  const matchedOtherNames = new Set<string>();

  for (const item of infoList) {
    if (MULTI_FIELDS.has(item.name)) {
      groups.push({ kind: 'origin-only', item });
      continue;
    }

    // targetNames 优先：此字段交给 other 侧
    if (targetNamesSet.has(item.name)) continue;

    const otherItem = otherIndex.get(item.name);
    if (otherItem) {
      groups.push({ kind: 'both', current: item, other: otherItem });
      matchedOtherNames.add(item.name);
    } else {
      groups.push({ kind: 'origin-only', item });
    }
  }

  // other 侧未匹配的字段（含多值字段）
  for (const item of otherInfoList) {
    if (MULTI_FIELDS.has(item.name)) {
      groups.push({ kind: 'other-only', item });
    } else if (!matchedOtherNames.has(item.name)) {
      groups.push({ kind: 'other-only', item });
    }
  }

  return groups;
}

// ═══════════════════════════════════════════════════════
// Step 2：按组应用策略，展平为 SingleInfo[]
// ═══════════════════════════════════════════════════════

function applyStrategies(
  groups: GroupedField[],
  auxPrefs: IAuxPrefs
): SingleInfo[] {
  const { originNames = [], targetNames = [] } = auxPrefs;
  const originNamesSet = new Set(
    Array.isArray(originNames) ? originNames : []
  );
  const prefersAllOrigin = originNames === 'all';
  const prefersAllTarget = targetNames === 'all';

  const result: SingleInfo[] = [];

  for (const group of groups) {
    if (group.kind === 'origin-only') {
      if (
        prefersAllTarget &&
        !prefersAllOrigin &&
        !originNamesSet.has(group.item.name)
      ) {
        continue;
      }
      result.push(group.item);
      continue;
    }

    if (group.kind === 'other-only') {
      // originNames 优先：other 侧对应字段跳过
      if (prefersAllOrigin || originNamesSet.has(group.item.name)) continue;
      result.push(group.item);
      continue;
    }

    // kind === 'both'：走策略选择
    const ctx: MergeContext = {
      current: group.current,
      other: group.other,
      auxPrefs,
    };
    result.push(...selectStrategy(ctx)(ctx));
  }

  return result;
}

// ═══════════════════════════════════════════════════════
// Step 3：去空值 + 去重
// ═══════════════════════════════════════════════════════

function dedup(items: SingleInfo[]): SingleInfo[] {
  // 非别名字段：name+value 唯一
  // 别名字段：value 全局唯一（防止与主标题等重复）
  const nonAliasValues = new Set(
    items
      .filter((v) => v.name !== '别名' && v.value)
      .map((v) => String(v.value))
  );
  const seen = new Set<string>();
  const aliasValueSeen = new Set<string>();

  return items.filter((v) => {
    if (!v.value) return false;

    const val = String(v.value);

    if (v.name === '别名') {
      if (nonAliasValues.has(val)) return false;
      if (aliasValueSeen.has(val)) return false;
      aliasValueSeen.add(val);
      return true;
    }

    const key = `${v.name}::${val}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ═══════════════════════════════════════════════════════
// 公开 API
// ═══════════════════════════════════════════════════════

/**
 * 结合不同网站的条目信息
 * @param infoList      当前的条目信息
 * @param otherInfoList 参考的条目信息
 * @param auxPrefs      合并偏好
 */
export function combineInfoList(
  infoList: SingleInfo[],
  otherInfoList: SingleInfo[],
  auxPrefs: IAuxPrefs = {}
): SingleInfo[] {
  if (!otherInfoList?.length) return infoList;
  if (!infoList?.length) return otherInfoList;

  const groups = groupFields(infoList, otherInfoList, auxPrefs);
  const merged = applyStrategies(groups, auxPrefs);
  return dedup(merged);
}
