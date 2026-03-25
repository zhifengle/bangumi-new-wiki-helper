import { SingleInfo } from '../interface/subject';
import { contentDraftStore } from './draftStore';
import {
  CharacterCreateInput,
  SourceRuntimeAdapter,
  SubjectCreateInput,
} from '../source/runtime';
import { backgroundMessageClient } from './messageClient';

async function hydrateCoverFromBackground(
  infoList: SingleInfo[],
  category: 'cover' | 'crt_cover'
) {
  for (let i = 0; i < infoList.length; i++) {
    const info = infoList[i];
    if (info.category !== category) continue;
    const dataUrl = info?.value?.dataUrl || '';
    let url = info?.value?.url || '';
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
      const nextDataUrl = await backgroundMessageClient.fetchImage(url, headers);
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
  await contentDraftStore.saveSubjectDraft(wikiData);
  if (shouldCheckDup) {
    await backgroundMessageClient.checkSubjectExist({
      subjectInfo: queryInfo,
      type: siteConfig.type,
      ...payload,
    });
    return;
  }
  await backgroundMessageClient.createNewSubject({
    type: siteConfig.type,
    ...payload,
  });
}

async function submitCharacterCreation({
  charaData,
}: CharacterCreateInput) {
  await contentDraftStore.saveCharacterDraft(charaData);
  await backgroundMessageClient.createNewCharacter();
}

export const contentRuntimeAdapter: SourceRuntimeAdapter = {
  fetchHtml(url: string) {
    return backgroundMessageClient.fetchHtml(url);
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
