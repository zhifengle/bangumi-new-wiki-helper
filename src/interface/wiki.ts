import { IPipeArr } from '../utils/textPipe';
import { SingleInfo } from './subject';

export interface Selector {
  selector: string;
  subSelector?: string;
  // 是否使用关键字查找，需要有 subSelector
  keyWord?: string | string[];
  // 有关键字的时候这个才有效。
  // 如果需要使用 sibling ，可以这样写 selector：  #target + div
  sibling?: boolean;
  // 是否为 iframe， 如果是 iframe 需要有 subSelector
  // 2021-05-10 subSelector 可以使用 nextSelector 替代
  isIframe?: boolean;
  // 2021-05-17 辅助定位 找到目标后调用的 $el.closest(xx)
  closest?: string;
  // 之前没考虑好 subSelector 的层级，为了兼容以前的代码使用 nextSelector
  nextSelector?: Selector | Selector[];
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
  selector: Selector | Selector[];
  // website 读取 anchor.href
  category?: string;
  // 2021-05-14 兼容之前的代码. 在 getWikiItem 里面
  pipes?: IPipeArr;
}

export type MusicModelKey =
  | 'vgmdb'
  | 'amazon_jp_music'
  | 'douban_music'
  | 'discogs';

export type CharaModelKey =
  | 'dlsite_game_chara'
  | 'dmm_game_chara'
  | 'getchu_chara';

export type ModelKey =
  | 'amazon_jp_book'
  | 'erogamescape'
  | 'getchu_game'
  | 'steam_game'
  | 'steamdb_game'
  | 'dangdang_book'
  | 'jd_book'
  | 'douban_game_edit'
  | 'douban_game'
  | 'dmm_game'
  | 'dmm_manga'
  | 'dlsite_game'
  | 'dlsite_manga'
  | 'adultcomic'
  | 'moepedia'
  | MusicModelKey
  | CharaModelKey;

export type CharaType = 'person' | 'character';

export interface SiteConfig {
  key: ModelKey;
  description: string;
  host: string[];
  urlRules?: RegExp[];
  // 区分页面是目标的选择器
  pageSelectors: Selector[];
  // 插入控制按钮位置的元素选择器
  controlSelector: Selector | Selector[];
  type: SubjectTypeId;
  subType?: number;
  itemList: InfoConfig[];
  defaultInfos?: SingleInfo[];
}

export interface CharaModel {
  key: CharaModelKey;
  // 使用同一个 key 用来关联游戏页面
  siteKey: ModelKey;
  description: string;
  host?: string[];
  urlRules?: RegExp[];
  // 包含角色信息的父节点
  itemSelector: Selector | Selector[];
  // 插入控制按钮位置的元素选择器
  controlSelector: Selector | Selector[];
  // @TODO person character
  type: SubjectTypeId;
  charaType?: CharaType;
  // @TODO 角色、组织机构
  subType?: number;
  itemList: InfoConfig[];
  defaultInfos?: SingleInfo[];
}
