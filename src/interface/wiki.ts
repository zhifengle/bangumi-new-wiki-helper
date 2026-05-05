import type { SingleInfo } from './subjectInfo';
import type { FieldSpec, FinalizeHook, SourceSpec } from '../sites/core/extraction';

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

export enum SubjectTypeId {
  book = 1,
  anime = 2,
  music = 3,
  game = 4,
  real = 6,
  all = 'all',
}
export type CharaType = 'person' | 'character';
export type CharaControlMode = 'select' | 'inline';

interface BaseSourceDefinition<TKey extends SourceModelKey> {
  key: TKey;
  description: string;
  // 仅用于远程抓取 `getWikiDataByURL()` 时，在同 host 的多个 model 之间进一步区分页面。
  // 这里匹配的是完整 URL 字符串，不参与当前页面 content script 的初始化判断；
  // 当前页面是否激活仍然主要依赖 host + pageSource/controlSource。
  // 如果同 host 下有多个 model 且都未命中 urlRules，则仍会按 catalog 注册顺序取第一个。
  urlRules?: RegExp[];
  itemList: FieldSpec[];
  defaults?: SingleInfo[];
  finalize?: FinalizeHook;
}

export interface SubjectSourceDefinition
  extends BaseSourceDefinition<SubjectModelKey> {
  host: string[];
  // 当前页面上的结构校验。即使 host 命中，也要靠这里确认页面真的是目标页。
  pageSource: SourceSpec;
  // 插入控制按钮位置的元素选择器
  controlSource: SourceSpec;
  type: SubjectTypeId;
  subType?: number;
}

export interface CharacterSourceDefinition
  extends BaseSourceDefinition<CharacterModelKey> {
  // 使用同一个 key 用来关联游戏页面
  siteKey: SubjectModelKey;
  host?: string[];
  // 包含角色信息的父节点
  itemSource: SourceSpec;
  // 角色区存在性判断锚点。
  // 适合 inline/select 共用的“这个页面上是否真的有这块角色区”判断。
  presenceSource?: SourceSpec;
  // select 模式下统一角色 UI 的挂载位置。
  // inline 模式通常不需要它，因为按钮是插到 item 上的。
  toolbarSource?: SourceSpec;
  // 角色控件模式
  controlMode?: CharaControlMode;
  // @TODO person character
  type: SubjectTypeId;
  charaType?: CharaType;
  // @TODO 角色、组织机构
  subType?: number;
}


