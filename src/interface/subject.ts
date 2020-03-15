import {SubjectTypeId} from "./wiki";

interface BaseSubject {
  name: string
  releaseDate?: string
}

export interface Subject extends BaseSubject{
  kind: 'subject'
}

export interface BookSubject extends BaseSubject {
  kind: 'book'
  isbn: string
  asin?: string
}

export interface SearchResult extends BaseSubject {
  url: string
  score?: number | string
  count?: number | string
  greyName?: string
}

export interface SingleInfo {
  name: string
  value: any
  category?: string
}

export interface SubjectWikiInfo {
  type: SubjectTypeId
  subtype?: string | number
  infos: SingleInfo[]
}

export type AllSubject = Subject | BookSubject
