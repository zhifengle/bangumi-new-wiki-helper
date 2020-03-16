import {fillInfoBox, insertFillFormBtn} from "../sites/bangumi";
import {$q, $qa} from "../utils/domUtils";
import {book as book2} from "../data/subject";

function initNewSubject() {
  // if (!/new_subject\/1/.test(document.location.pathname)) return;
  const $t = $q('form[name=create_subject] [name=subject_title]').parentElement
  const defaultVal = ($q('#subject_infobox') as HTMLTextAreaElement).value;
  // TODO: data ?
  insertFillFormBtn(
    $t,
    async (e) => {
      await fillInfoBox(book2)
    },
    () => {
      // 清除默认值
      $qa('input[name=platform]').forEach(element => {
        (element as HTMLInputElement).checked = false;
      });
      const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]') as HTMLElement;
      $wikiMode.click();
      // @ts-ignore
      $q('#subject_infobox').value = defaultVal;
      // @ts-ignore
      $q('#columnInSubjectA [name=subject_title]').value = '';
      // @ts-ignore
      $q('#subject_summary').value = '';
    }
  )
}

function init() {
  const re = new RegExp(['new_subject', 'add_related', 'character\/new', 'upload_img'].join('|'));
  const page = document.location.href.match(re);
  if (!page) return;
  switch (page[0]) {
    case 'new_subject':
      initNewSubject()
      break
    case 'add_related':
      // this.addRelated();
      break;
    case 'character\/new':
      // this.newCharacter();
      break;
    case 'upload_img':
      break;
  }
}

init();
