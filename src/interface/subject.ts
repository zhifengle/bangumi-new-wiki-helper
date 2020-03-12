export interface Subject {
  name: string
  releaseDate?: string
}

export interface BookSubject extends Subject {
  isbn: string,
  asin?: string
}

export interface SearchResult extends Subject {
  url: string
  score?: number | string
  count?: number | string
  greyName?: string
}

export interface SingleInfo {
  name: string,
  value: any,
  category?: string
}

export interface SubjectWikiInfo {
  type: string,
  subtype?: string | number
  infos: SingleInfo[]
}
