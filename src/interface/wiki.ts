export interface Selector {
  selector: string
  subSelector?: string
  keyWord?: string
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
