import { getStringValue, SingleInfo, SubjectWikiInfo } from '../../../interface/subjectInfo';
import { sendFormImg, sendForm } from '../../../utils/ajax';
import { $q, htmlToElement } from '../../../utils/domUtils';
import { sleep } from '../../../utils/async/sleep';
import { insertLoading } from '../imageWidget';
import {
  addPersonRelatedCV,
  addPersonRelatedSubject,
  addMusicEp,
  searchCVByName,
  uploadSubjectCover,
} from '../related';
import { genLinkText, getBgmHost, getSubjectId, insertLogInfo } from '../common';

export function getSubmitBtnText(wikiInfo: SubjectWikiInfo) {
  let text = '添加条目并上传封面';
  if (location.pathname === '/new_subject/3') {
    // 音乐条目，添加ep
    const discInfo = wikiInfo.infos.find(
      (item: SingleInfo) => item.category === 'ep'
    );
    if (discInfo) {
      text = '添加条目并上传封面、添加曲目';
    }
  }
  return text;
}

export function initSubjectSubmit(wikiInfo: SubjectWikiInfo) {
  setTimeout(() => {
    const $form = $q('form[name=create_subject]') as HTMLFormElement;
    const $input = $q(
      '.e-wiki-cover-container [name=submit]'
    ) as HTMLInputElement;
    const $clonedInput = $input.cloneNode(true) as HTMLInputElement;
    if ($clonedInput) {
      $clonedInput.value = getSubmitBtnText(wikiInfo);
    }
    $input.insertAdjacentElement('afterend', $clonedInput);
    $input.remove();
    const $canvas: HTMLCanvasElement = $q('#e-wiki-cover-preview');
    $clonedInput.addEventListener('click', async (e) => {
      e.preventDefault();
      const $el = e.target as HTMLElement;
      $el.style.display = 'none';
      $clonedInput.style.display = 'none';
      const $loading = insertLoading($el);
      try {
        const $wikiMode = $q(
          'table small a:nth-of-type(1)[href="javascript:void(0)"]'
        ) as HTMLElement;
        $wikiMode && $wikiMode.click();
        await sleep(200);
        const url = await sendForm($form);
        const subjectId = getSubjectId(url);
        if (subjectId) {
          if ($canvas.clientWidth > 8 && $canvas.clientHeight > 10) {
            await uploadSubjectCover(subjectId, $canvas.toDataURL('image/png', 1));
          }
        }
        await sleep(200);
        await addMusicEp(subjectId, wikiInfo, (str) => {
          insertLogInfo($el, str);
        });
        $loading.remove();
        $el.style.display = '';
        $clonedInput.style.display = '';
        location.assign(url);
      } catch (e) {
        console.log('send form err: ', e);
      }
    });
  }, 300);
}

export function initCharacterSubmit(wikiInfo: SubjectWikiInfo, dataUrl: string) {
  setTimeout(() => {
    const $form = $q('form[name=new_character]') as HTMLFormElement;
    const $input = $q(
      '.e-wiki-cover-container [name=submit]'
    ) as HTMLInputElement;
    const $clonedInput = $input.cloneNode(true) as HTMLInputElement;
    if ($clonedInput) {
      $clonedInput.value = '添加人物并上传肖像';
    }
    $input.insertAdjacentElement('afterend', $clonedInput);
    $input.remove();
    // 2021-05-19 关联条目 id.
    const $relatedInput = htmlToElement(`
<span class="e-bnwh-related-id">
<span title="为空时不做关联操作">关联条目 id:</span>
<input type="number" placeholder="输入关联条目 id" />
</span>
      `) as Element;
    $clonedInput.insertAdjacentElement('afterend', $relatedInput);
    const $canvas: HTMLCanvasElement = $q('#e-wiki-cover-preview');
    $clonedInput.addEventListener('click', async (e) => {
      e.preventDefault();
      if ($canvas.width > 8 && $canvas.height > 10) {
        const $el = e.target as HTMLElement;
        $el.style.display = 'none';
        $clonedInput.style.display = 'none';
        const $loading = insertLoading($el);
        try {
          const $wikiMode = $q(
            'table small a:nth-of-type(1)[href="javascript:void(0)"]'
          ) as HTMLElement;
          $wikiMode && $wikiMode.click();
          await sleep(200);
          const currentHost = getBgmHost();
          const url = await sendFormImg($form, dataUrl);
          insertLogInfo($el, `新建角色成功: ${genLinkText(url, '角色地址')}`);
          const charaId = getSubjectId(url);
          // subject id
          const subjectId = $relatedInput.querySelector('input')?.value || '';
          if (charaId && subjectId) {
            insertLogInfo($el, '存在条目 id, 开始关联条目');
            await addPersonRelatedSubject([subjectId], charaId, wikiInfo.type);
            insertLogInfo(
              $el,
              `关联条目成功: ${genLinkText(
                `${currentHost}/subject/${subjectId}`,
                '条目地址'
              )}`
            );
            const cvInfo = wikiInfo.infos.filter(
              (item: SingleInfo) => item.name.toUpperCase() === 'CV'
            )[0];
            if (cvInfo) {
              const cvId = await searchCVByName(getStringValue(cvInfo.value), charaId);
              cvId &&
                (await addPersonRelatedCV(subjectId, charaId, [cvId], wikiInfo.type));
              insertLogInfo(
                $el,
                `关联 CV 成功: ${genLinkText(`${currentHost}/person/${cvId}`)}`
              );
            }
          }
          $loading.remove();
          $el.style.display = '';
          $clonedInput.style.display = '';
          location.assign(url);
        } catch (e) {
          console.log('send form err: ', e);
          insertLogInfo($el, `出错了: ${e}`);
        }
      }
    });
  }, 300);
}

export type PersonSubmitDeps = {
  // 页面跳转可注入，jsdom 里没有真正的导航能力，测试靠它断言目标地址
  navigate?: (url: string) => void;
};

function hasPortrait($canvas: HTMLCanvasElement | null) {
  return !!$canvas && $canvas.width > 8 && $canvas.height > 10;
}

// 人物页没有关联条目与 CV 的步骤；没有肖像时也允许直接提交表单
export function initPersonSubmit(dataUrl: string, deps: PersonSubmitDeps = {}) {
  const navigate = deps.navigate ?? ((url: string) => location.assign(url));
  setTimeout(() => {
    const $form = $q('form[name=new_character]') as HTMLFormElement | null;
    const $input = $q(
      '.e-wiki-cover-container [name=submit]'
    ) as HTMLInputElement | null;
    if (!$form || !$input) return;
    const $clonedInput = $input.cloneNode(true) as HTMLInputElement;
    $clonedInput.value = '添加人物并上传肖像';
    $input.insertAdjacentElement('afterend', $clonedInput);
    $input.remove();
    const $canvas = $q('#e-wiki-cover-preview') as HTMLCanvasElement | null;
    $clonedInput.addEventListener('click', async (e) => {
      e.preventDefault();
      const $el = e.target as HTMLElement;
      $el.style.display = 'none';
      $clonedInput.style.display = 'none';
      const $loading = insertLoading($el);
      try {
        const $wikiMode = $q(
          'table small a:nth-of-type(1)[href="javascript:void(0)"]'
        ) as HTMLElement | null;
        $wikiMode?.click();
        await sleep(200);
        const url = hasPortrait($canvas)
          ? await sendFormImg(
              $form,
              $canvas!.toDataURL('image/png', 1) || dataUrl
            )
          : await sendForm($form);
        insertLogInfo($el, `新建人物成功: ${genLinkText(url, '人物地址')}`);
        $loading.remove();
        $el.style.display = '';
        $clonedInput.style.display = '';
        navigate(url);
      } catch (e) {
        console.log('send form err: ', e);
        insertLogInfo($el, `出错了: ${e}`);
        $loading.remove();
        $el.style.display = '';
        $clonedInput.style.display = '';
      }
    });
  }, 300);
}

