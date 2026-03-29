import type { IPipeArr } from '../utils/textPipe';
import type { TextPatternInput } from './textPattern';
import type { SingleInfo } from './subjectInfo';

export const musicModelKeys = [
  'vgmdb',
  'amazon_jp_music',
  'douban_music',
] as const;

export const subjectModelKeys = [
  'amazon_jp_book',
  'erogamescape',
  'getchu_game',
  'steam_game',
  'steamdb_game',
  'dangdang_book',
  'jd_book',
  'douban_game_edit',
  'douban_game',
  'dmm_game',
  'dmm_manga',
  'dlsite_game',
  'dlsite_manga',
  'adultcomic',
  'moepedia',
  ...musicModelKeys,
] as const;

export const characterModelKeys = [
  'getchu_game_chara',
  'dlsite_game_chara',
  'dmm_game_chara',
] as const;

export type MusicModelKey = (typeof musicModelKeys)[number];
export type SubjectModelKey = (typeof subjectModelKeys)[number];
export type CharacterModelKey = (typeof characterModelKeys)[number];
export type CharaModelKey = CharacterModelKey;
export type SourceModelKey = SubjectModelKey | CharacterModelKey;
export type ModelKey = SourceModelKey;

// 单个 Selector 表示一段定位逻辑；数组表示按顺序尝试的 fallback。
// `findElement()` 会返回第一个命中的 selector；
// `findAllElement()` 会返回第一个能找到结果的 selector 对应的整批结果。
export type SelectorInput = Selector | Selector[];

// Selector 支持 4 种常见模式：
// 1. 直接选择：只写 `selector`
// 2. 父节点 + 子节点关键字过滤：`selector + subSelector + keyWord`
// 3. iframe 内查找：`selector + isIframe + subSelector`
// 4. 链式定位：在上面任一模式命中后继续走 `nextSelector`
export interface Selector {
  // 基础 CSS 选择器。
  // 没有 `subSelector` 时，直接返回当前上下文下命中的元素。
  selector: string;

  // 子选择器。
  // 非 iframe 模式下，会先找到 `selector` 对应的父节点，再在父节点内查找这里指定的子节点。
  // iframe 模式下，它表示在 iframe document 内执行的选择器。
  subSelector?: string;

  // 关键字过滤条件，只在 “selector + subSelector” 这条路径下生效。
  // 当前实现里会用候选节点的文本做匹配，支持字符串或 RegExp，匹配时默认忽略大小写。
  // 一般需要和 `subSelector` 配合使用。
  keyWord?: TextPatternInput;

  // 只在关键字过滤路径下生效。
  // 命中 `keyWord` 的其实是 `subSelector` 对应的标签；如果真实目标在它的相邻兄弟节点上，
  // 就把结果切到最后一个命中节点的 `nextElementSibling`。
  sibling?: boolean;

  // 是否进入 iframe 内查找。
  // 开启后 `selector` 应指向 iframe 元素，`subSelector` 会在 iframe document 中执行。
  // 如果当前上下文本身已经是 iframe document，则会直接在该 document 内查找 `subSelector`。
  isIframe?: boolean;

  // 后处理定位。
  // 当前 selector 命中后，再对结果调用 `$el.closest(closest)`，用于回退到更合适的父节点。
  closest?: string;

  // 链式定位。
  // 当前 selector 先定位到一个结果，再把该结果作为新的上下文继续执行 `nextSelector`。
  // `findElement()` 是单条链往下走；`findAllElement()` 会先找出当前层所有父节点，再对每个父节点继续展开。
  nextSelector?: SelectorInput;
}

export enum SubjectTypeId {
  book = 1,
  anime = 2,
  music = 3,
  game = 4,
  real = 6,
  all = 'all',
}
export interface InfoConfig {
  name: string;
  selector: SelectorInput;
  // website 读取 anchor.href
  category?: string;
  // 2021-05-14 兼容之前的代码. 在 getWikiItem 里面
  pipes?: IPipeArr;
}

export type CharaType = 'person' | 'character';
export type CharaControlMode = 'select' | 'inline';

interface BaseSourceDefinition<TKey extends SourceModelKey> {
  key: TKey;
  description: string;
  // 仅用于远程抓取 `getWikiDataByURL()` 时，在同 host 的多个 model 之间进一步区分页面。
  // 这里匹配的是完整 URL 字符串，不参与当前页面 content script 的初始化判断；
  // 当前页面是否激活仍然主要依赖 host + pageSelectors/controlSelector。
  // 如果同 host 下有多个 model 且都未命中 urlRules，则仍会按 catalog 注册顺序取第一个。
  urlRules?: RegExp[];
  itemList: InfoConfig[];
  defaultInfos?: SingleInfo[];
}

export interface SubjectSourceDefinition
  extends BaseSourceDefinition<SubjectModelKey> {
  host: string[];
  // 当前页面上的结构校验。即使 host 命中，也要靠这里确认页面真的是目标页。
  pageSelectors: SelectorInput;
  // 插入控制按钮位置的元素选择器
  controlSelector: SelectorInput;
  type: SubjectTypeId;
  subType?: number;
}

export interface CharacterSourceDefinition
  extends BaseSourceDefinition<CharacterModelKey> {
  // 使用同一个 key 用来关联游戏页面
  siteKey: SubjectModelKey;
  host?: string[];
  // 包含角色信息的父节点
  itemSelector: SelectorInput;
  // 插入控制按钮位置的元素选择器
  controlSelector: SelectorInput;
  // 角色控件模式
  controlMode?: CharaControlMode;
  // @TODO person character
  type: SubjectTypeId;
  charaType?: CharaType;
  // @TODO 角色、组织机构
  subType?: number;
}


