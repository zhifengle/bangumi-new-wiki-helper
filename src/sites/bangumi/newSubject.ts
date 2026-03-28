import {
  getCoverValue,
  getStringValue,
  isCoverValue,
  SingleInfo,
  SubjectWikiInfo,
} from '../../interface/subject';
import { $q, $qa } from '../../utils/domUtils';
import { sleep } from '../../utils/async/sleep';
import { initImageWidget } from './imageWidget';
import { convertInfoValue } from './newSubject/mapper';
import { insertFillFormBtn } from './newSubject/controls';
import { initCharacterSubmit, initSubjectSubmit } from './newSubject/submit';
export { convertInfoValue } from './newSubject/mapper';
export { insertFillFormBtn } from './newSubject/controls';

const SUBJECT_TYPE_INPUT_SELECTOR =
  'table tr:nth-of-type(2) > td:nth-of-type(2) input';
const SUBJECT_TITLE_SELECTOR = 'input[name=subject_title]';
const SUBJECT_SUMMARY_SELECTOR = '#subject_summary';
const CHARACTER_SUMMARY_SELECTOR = '#crt_summary';
const CHARACTER_NAME_SELECTOR = '#crt_name';
const WIKI_MODE_SELECTOR =
  'table small a:nth-of-type(1)[href="javascript:void(0)"]';
const NEWBIE_MODE_SELECTOR =
  'table small a:nth-of-type(2)[href="javascript:void(0)"]';
const SUBJECT_INFOBOX_SELECTOR = '#subject_infobox';
const SUBJECT_TITLE_RESET_SELECTOR = '#columnInSubjectA [name=subject_title]';
const CHARACTER_NAME_RESET_SELECTOR = '#columnInSubjectA #crt_name';
const COVER_CLEAR_BUTTON_SELECTOR = '.e-wiki-cover-container .clear-btn';
const COVER_SUBMIT_SELECTOR = '.e-wiki-cover-container [name=submit]';
const SUBJECT_FORM_SELECTOR = 'form[name=create_subject]';
const CHARACTER_FORM_SELECTOR = 'form[name=new_character]';
const UPLOAD_FORM_SELECTOR = 'form[name=img_upload]';
const FORM_TITLE_PARENT_SELECTOR =
  'form[name=create_subject] [name=subject_title]';
const CHARACTER_TITLE_PARENT_SELECTOR = 'form[name=new_character] #crt_name';

const SUBJECT_NAME_MAP: Record<string, string> = {
  誕生日: '生日',
  スリーサイズ: 'BWH',
};

function getInput(selector: string) {
  return $q<HTMLInputElement>(selector);
}

function getTextArea(selector: string) {
  return $q<HTMLTextAreaElement>(selector);
}

function getElement<E extends Element>(selector: string) {
  return $q<E>(selector);
}

function clickIfPresent(selector: string) {
  getElement<HTMLElement>(selector)?.click();
}

function setInputValue(selector: string, value: string) {
  const input = getInput(selector);
  if (input) {
    input.value = value;
  }
}

function setTextAreaValue(selector: string, value: string) {
  const textArea = getTextArea(selector);
  if (textArea) {
    textArea.value = value;
  }
}

function getInfoBoxValue() {
  return getTextArea(SUBJECT_INFOBOX_SELECTOR)?.value ?? '';
}

function clearPlatformInputs() {
  $qa<HTMLInputElement>('input[name=platform]').forEach((element) => {
    element.checked = false;
  });
}

function dispatchClearInfoEvent() {
  window.dispatchEvent(
    new CustomEvent<{ type: string }>('scriptMessage', {
      detail: {
        type: 'clearInfo',
      },
    })
  );
}

function resetSubjectForm(defaultVal: string) {
  clearPlatformInputs();
  clickIfPresent(WIKI_MODE_SELECTOR);
  setTextAreaValue(SUBJECT_INFOBOX_SELECTOR, defaultVal);
  setInputValue(SUBJECT_TITLE_RESET_SELECTOR, '');
  setInputValue(SUBJECT_SUMMARY_SELECTOR, '');
  getInput(COVER_CLEAR_BUTTON_SELECTOR)?.click();
  setInputValue('#editSummary', '');
  dispatchClearInfoEvent();
  const submitInput = getInput(COVER_SUBMIT_SELECTOR);
  if (submitInput) {
    submitInput.value = '添加条目并上传封面';
  }
}

function resetCharacterForm(defaultVal: string) {
  clickIfPresent(WIKI_MODE_SELECTOR);
  setTextAreaValue(SUBJECT_INFOBOX_SELECTOR, defaultVal);
  setInputValue(CHARACTER_NAME_RESET_SELECTOR, '');
  setInputValue(CHARACTER_SUMMARY_SELECTOR, '');
  getElement('.e-wiki-cover-container')?.remove();
}

/**
 * 填写 wiki 表单
 * TODO: 使用 MutationObserver 实现
 * @param wikiData
 */
export async function fillInfoBox(wikiData: SubjectWikiInfo) {
  const { infos } = wikiData;
  const subType = Number(wikiData.subtype);
  const infoArray: SingleInfo[] = [];
  const typeInputs = Array.from($qa<HTMLInputElement>(SUBJECT_TYPE_INPUT_SELECTOR));
  if (typeInputs.length) {
    typeInputs[0]?.click();
    if (!Number.isNaN(subType)) {
      typeInputs[subType]?.click();
    }
  }
  await sleep(100);

  const wikiMode = getElement<HTMLElement>(WIKI_MODE_SELECTOR);
  const newbieMode = getElement<HTMLElement>(NEWBIE_MODE_SELECTOR);
  for (let i = 0, len = infos.length; i < len; i++) {
    const currentInfo = infos[i];
    const infoValue = getStringValue(currentInfo.value).trim();
    if (currentInfo.category === 'subject_title') {
      setInputValue(SUBJECT_TITLE_SELECTOR, infoValue);
      continue;
    }
    if (currentInfo.category === 'subject_summary') {
      setInputValue(SUBJECT_SUMMARY_SELECTOR, infoValue);
      continue;
    }
    if (currentInfo.category === 'crt_summary') {
      setInputValue(CHARACTER_SUMMARY_SELECTOR, infoValue);
      continue;
    }
    if (currentInfo.category === 'crt_name') {
      setInputValue(CHARACTER_NAME_SELECTOR, infoValue);
      continue;
    }
    if (currentInfo.category === 'checkbox') {
      const target = getInput(`input[name=${currentInfo.name}]`);
      if (target) {
        target.checked = Boolean(currentInfo.value);
      }
      continue;
    }
    // 有名称并且category不在特定列表里面
    if (
      currentInfo.name &&
      !['cover', 'crt_cover', 'ep'].includes(currentInfo.category ?? '')
    ) {
      const name = currentInfo.name;
      if (Object.prototype.hasOwnProperty.call(SUBJECT_NAME_MAP, name)) {
        infoArray.push({
          ...currentInfo,
          name: SUBJECT_NAME_MAP[name],
        });
      } else {
        infoArray.push(currentInfo);
      }
    }
  }
  wikiMode?.click();
  await sleep(200);
  const infoBox = getTextArea(SUBJECT_INFOBOX_SELECTOR);
  if (infoBox) {
    infoBox.value = convertInfoValue(infoBox.value, infoArray);
  }
  await sleep(200);
  newbieMode?.click();
}

export function initNewSubject(wikiInfo: SubjectWikiInfo) {
  const titleInput = getElement<HTMLElement>(FORM_TITLE_PARENT_SELECTOR);
  const parent = titleInput?.parentElement;
  if (!parent) {
    return;
  }
  const defaultVal = getInfoBoxValue();
  insertFillFormBtn(
    parent,
    async () => {
      await fillInfoBox(wikiInfo);
      setInputValue('#editSummary', '新条目');
    },
    () => {
      resetSubjectForm(defaultVal);
    }
  );
  const coverInfo = wikiInfo.infos.filter(
    (item: SingleInfo) => item.category === 'cover'
  )[0];
  const dataUrl = getCoverValue(coverInfo?.value)?.dataUrl || '';
  const subjectForm = getElement<HTMLFormElement>(SUBJECT_FORM_SELECTOR);
  if (subjectForm) {
    initImageWidget(subjectForm, dataUrl);
  }
  initSubjectSubmit(wikiInfo);
}

export function initNewCharacter(
  wikiInfo: SubjectWikiInfo,
  _subjectId?: string | number | null
) {
  const titleInput = getElement<HTMLElement>(CHARACTER_TITLE_PARENT_SELECTOR);
  const parent = titleInput?.parentElement;
  if (!parent) {
    return;
  }
  const defaultVal = getInfoBoxValue();
  insertFillFormBtn(
    parent,
    async () => {
      await fillInfoBox(wikiInfo);
    },
    () => {
      resetCharacterForm(defaultVal);
    }
  );
  const coverInfo = wikiInfo.infos.filter(
    (item: SingleInfo) => item.category === 'crt_cover'
  )[0];
  let dataUrl = '';
  if (coverInfo && coverInfo.value) {
    if (isCoverValue(coverInfo.value)) {
      dataUrl = getCoverValue(coverInfo.value)?.dataUrl || '';
    } else {
      dataUrl = getStringValue(coverInfo.value);
    }
  }
  const characterForm = getElement<HTMLFormElement>(CHARACTER_FORM_SELECTOR);
  if (characterForm) {
    initImageWidget(characterForm, dataUrl);
  }
  initCharacterSubmit(wikiInfo, dataUrl);
}

export function initUploadImg(wikiInfo: SubjectWikiInfo) {
  const coverInfo = wikiInfo.infos.filter(
    (item: SingleInfo) => item.category === 'cover'
  )[0];
  const uploadForm = getElement<HTMLFormElement>(UPLOAD_FORM_SELECTOR);
  if (uploadForm) {
    initImageWidget(uploadForm, getCoverValue(coverInfo?.value)?.dataUrl);
  }
}
