export interface Subject {
  name: string
  releaseDate: Date | string
}

export interface BookSubject extends Subject {
  isbn: string,
  asin: string
}

export interface SearchResult extends Subject {
  score: number | string
  count: number | string
  greyName?: string
  url: string
}

export interface SubjectInfo {
  name: string,
  value: any,
  category?: string
}

export interface SubjectWikiInfo {
  type: string,
  subtype?: string | number
  infos: SubjectInfo[]
}
