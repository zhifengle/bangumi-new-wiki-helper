export interface Selector {
  selector: string
  subSelector?: string
  keyWord?: string | string[]
  sibling?: boolean
  separator?: string
}

export enum SubjectTypeId {
  book = 1,
  anime = 2,
  music = 3,
  game = 4,
  real = 6,
  all = 'all'
}
export interface InfoConfig {
  name: string
  selector: Selector | Selector[]
  category?: string
}

export interface SiteConfig {
  key: string
  description: string
  // 区分页面是目标的选择器
  pageSelector: Selector[],
  // 插入控制按钮位置的元素选择器
  controlSelector: Selector,
  type: SubjectTypeId,
  itemList: InfoConfig[]
}
