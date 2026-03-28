import { getCoverValue, SingleInfo } from '../interface/subject';
import {
  CharacterCreateInput,
  SourceRuntimeAdapter,
  SubjectCreateInput,
} from '../source/runtime';
import { contentRuntimeCapabilities } from './runtimeCapabilities';

async function hydrateCoverFromBackground(
  infoList: SingleInfo[],
  category: 'cover' | 'crt_cover'
) {
  for (let i = 0; i < infoList.length; i++) {
    const info = infoList[i];
    if (info.category !== category) continue;
    const coverValue = getCoverValue(info.value);
    const dataUrl = coverValue?.dataUrl || '';
    let url = coverValue?.url || '';
    if (!/^data:image/.test(dataUrl) && url) {
      console.log('fetch cover by background');
      if (!/^http/.test(url)) {
        url = new URL(url, location.href).href;
      }
      let headers: Record<string, string> | undefined = undefined;
      const m = url.match(/brandnew\/(\d+)/);
      if (m) {
        headers = {
          Referer: `http://www.getchu.com/soft.phtml?id=${m[1]}`,
        };
      }
      const nextDataUrl = await contentRuntimeCapabilities.transport.fetchImage?.(
        url,
        headers
      );
      if (nextDataUrl) {
        info.value = {
          url,
          dataUrl: nextDataUrl,
        };
      }
    }
  }
}

async function submitSubjectCreation({
  siteConfig,
  wikiData,
  queryInfo,
  payload,
  shouldCheckDup,
}: SubjectCreateInput) {
  const subjectCreation = contentRuntimeCapabilities.subjectCreation;
  if (!subjectCreation) {
    throw new Error('content subjectCreation capability is missing');
  }
  await contentRuntimeCapabilities.storage.saveSubjectDraft(wikiData);
  if (shouldCheckDup) {
    await subjectCreation.checkSubjectExist({
      subjectInfo: queryInfo,
      type: siteConfig.type,
      ...payload,
    });
    return;
  }
  await subjectCreation.createNewSubject({
    type: siteConfig.type,
    ...payload,
  });
}

async function submitCharacterCreation({
  charaData,
}: CharacterCreateInput) {
  const subjectCreation = contentRuntimeCapabilities.subjectCreation;
  if (!subjectCreation) {
    throw new Error('content subjectCreation capability is missing');
  }
  await contentRuntimeCapabilities.storage.saveCharacterDraft(charaData);
  await subjectCreation.createNewCharacter();
}

export const contentRuntimeAdapter: SourceRuntimeAdapter = {
  fetchHtml(url: string) {
    return contentRuntimeCapabilities.transport.fetchHtml(url);
  },
  hydrateSubjectCover(infoList: SingleInfo[]) {
    return hydrateCoverFromBackground(infoList, 'cover');
  },
  hydrateCharacterCover(infoList: SingleInfo[]) {
    return hydrateCoverFromBackground(infoList, 'crt_cover');
  },
  submitSubjectCreation,
  submitCharacterCreation,
};
