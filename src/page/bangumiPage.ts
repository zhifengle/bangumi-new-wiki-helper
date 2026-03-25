import {
  initNewCharacter,
  initNewSubject,
  initUploadImg,
} from '../sites/bangumi/newSubject';
import { $q } from '../utils/domUtils';
import { BangumiPageRuntimeAdapter } from './bangumiRuntime';

function getPageType() {
  const re = new RegExp(
    ['new_subject', 'add_related', 'character/new', 'upload_img'].join('|')
  );
  return document.location.href.match(re)?.[0] || '';
}

function getEmptySubjectInfo() {
  return {
    type: +window.location.pathname.split('/')[2] || 1,
    infos: [],
  };
}

function registerClearListener(runtime: BangumiPageRuntimeAdapter) {
  window.addEventListener('scriptMessage', async (e: any) => {
    if (e.detail.type === 'clearInfo') {
      console.info('clear info');
      await runtime.clearInfo();
    }
  });
}

function triggerAutoFill(runtime: BangumiPageRuntimeAdapter, delay = 200) {
  setTimeout(async () => {
    const $fillForm = $q('.e-wiki-fill-form') as HTMLElement;
    if (!$fillForm) return;
    $fillForm.click();
    await runtime.markAutoFillConsumed?.();
  }, delay);
}

export async function initBangumiPage(runtime: BangumiPageRuntimeAdapter) {
  const pageType = getPageType();
  if (!pageType) return;
  const state = await runtime.loadPageState();
  registerClearListener(runtime);
  switch (pageType) {
    case 'new_subject':
      if (state.wikiData) {
        initNewSubject(state.wikiData);
        if (state.shouldAutoFill) {
          triggerAutoFill(runtime, state.autoFillDelay);
        }
      } else {
        initNewSubject(getEmptySubjectInfo());
      }
      break;
    case 'add_related':
      break;
    case 'character/new':
      if (state.charaData) {
        initNewCharacter(state.charaData, state.subjectId as any);
        if (state.shouldAutoFill) {
          triggerAutoFill(runtime, state.autoFillDelay);
        }
      }
      break;
    case 'upload_img':
      if (state.wikiData) {
        initUploadImg(state.wikiData);
      }
      break;
  }
}
