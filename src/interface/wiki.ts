import { SingleInfo } from './subject';

export interface Selector {
  selector: string;
  subSelector?: string;
  // 是否使用关键字查找，需要有 subSelector
  keyWord?: string | string[];
  // 有关键字的时候这个才有效。
  // 如果需要使用 sibling ，可以这样写 selector：  #target + div
  sibling?: boolean;
  separator?: string;
  // 是否为 iframe， 如果是 iframe 需要有 subSelector
  // 2021-05-10 subSelector 可以使用 nextSelector 替代
  isIframe?: boolean;
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
  category?: string;
}

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
  | 'dlsite_game'
  | 'dlsite_manga';

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
