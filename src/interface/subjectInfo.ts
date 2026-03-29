import type { MusicDiscTrack } from './types';
import type { SubjectTypeId } from './wiki';

interface BaseSubject {
  name: string;
  releaseDate?: string;
}

export interface Subject extends BaseSubject {
  kind: 'subject';
}

export interface BookSubject extends BaseSubject {
  kind: 'book';
  isbn: string;
  asin?: string;
}

export interface SearchResult extends BaseSubject {
  url: string;
  score?: number | string;
  count?: number | string;
  greyName?: string;
}

export type SubjectQueryInfo = Partial<
  Pick<BookSubject, 'name' | 'releaseDate' | 'isbn' | 'asin'>
>;

export type SingleInfoCoverValue = {
  url?: string;
  dataUrl?: string;
};

export type SingleInfoTrack = Pick<MusicDiscTrack, 'title'> &
  Partial<Omit<MusicDiscTrack, 'title'>>;

export type SingleInfoValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | SingleInfoTrack[]
  | SingleInfoTrack[][]
  | SingleInfoCoverValue;

export interface SingleInfo {
  name: string;
  value: SingleInfoValue;
  category?: string;
}

export interface SubjectWikiInfo {
  type: SubjectTypeId;
  subtype?: string | number;
  infos: SingleInfo[];
}

export type AllSubject = Subject | BookSubject;

export function getStringValue(value: SingleInfoValue, fallback = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

export function isCoverValue(value: SingleInfoValue): value is SingleInfoCoverValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    ('url' in value || 'dataUrl' in value)
  );
}

export function getCoverValue(
  value: SingleInfoValue
): SingleInfoCoverValue | undefined {
  if (isCoverValue(value)) {
    return value;
  }
  return undefined;
}

export function isTrackListValue(value: SingleInfoValue): value is SingleInfoTrack[][] {
  return (
    Array.isArray(value) &&
    value.every((disc) =>
      Array.isArray(disc) &&
      disc.every(
        (track) => typeof track === 'object' && track !== null && 'title' in track
      )
    )
  );
}
