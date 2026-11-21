import type { SearchResult, SubjectCreator } from '../../interface/subjectInfo';
import { SubjectTypeId } from '../../interface/wiki';
import { fetchJson } from '../../utils/fetchData';
import { hasSameSearchName, normalizeSearchName } from '../core/search';
import { matchesSubjectTitle } from '../core/subjectTitle';
import { searchPersonCandidates } from './personSearch';

const creatorRoles: Partial<Record<SubjectTypeId, SubjectCreator['role'][]>> = {
  [SubjectTypeId.game]: ['原画', '剧本'],
  [SubjectTypeId.book]: ['作画', '作者', '原作', '插图', '原画'],
  [SubjectTypeId.music]: ['艺术家', '作曲'],
};

function chooseCreator(creators: readonly SubjectCreator[], type: SubjectTypeId) {
  let singleName: SubjectCreator | undefined;
  for (const role of creatorRoles[type] ?? []) {
    const credits = creators.filter((credit) => credit.role === role && credit.name.trim());
    const knownPeople = new Map<number, SubjectCreator>();
    const names = new Map<string, SubjectCreator>();
    for (const credit of credits) {
      const id = credit.bangumiPersonId;
      if (id && Number.isSafeInteger(id) && id > 0) knownPeople.set(id, credit);
      names.set(normalizeSearchName(credit.name), credit);
    }
    if (knownPeople.size === 1) return knownPeople.values().next().value;
    if (knownPeople.size > 1) continue;
    if (names.size === 1) singleName ??= names.values().next().value;
  }
  return singleName;
}

export async function searchSubjectsByCreator(
  title: string,
  type: SubjectTypeId,
  creators: readonly SubjectCreator[]
): Promise<SearchResult[]> {
  const creator = chooseCreator(creators, type);
  if (!creator) return [];

  let personId = creator.bangumiPersonId;
  let personName = creator.name;
  if (!personId || !Number.isSafeInteger(personId) || personId < 1) {
    const exact = (await searchPersonCandidates(personName))
      .filter((person) => hasSameSearchName(person, personName));
    const people = new Map(exact.map((person) => [person.url, person]));
    if (people.size !== 1) return [];
    const [person] = people.values();
    personId = Number(person.url.match(/^\/person\/([1-9]\d*)$/)?.[1]);
    if (!Number.isSafeInteger(personId)) return [];
    personName = person.name;
  }

  const works = await fetchJson<unknown>(`https://api.bgm.tv/v0/persons/${personId}/subjects`);
  if (!Array.isArray(works)) throw new Error('Invalid Bangumi person works response');

  const candidates: SearchResult[] = [];
  for (const work of works) {
    if (!work || work.type !== type || !Number.isSafeInteger(work.id) || work.id < 1 ||
      typeof work.name !== 'string') continue;
    const candidate = {
      name: work.name,
      greyName: typeof work.name_cn === 'string' ? work.name_cn : undefined,
      url: `/subject/${work.id}`,
      personCredit: {
        name: personName,
        staff: typeof work.staff === 'string' ? work.staff : undefined,
      },
    };
    if (matchesSubjectTitle(candidate, title)) candidates.push(candidate);
  }
  return candidates;
}
