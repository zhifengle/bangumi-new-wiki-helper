import { SingleInfo, SubjectWikiInfo } from '../../interface/subject';
import { $q, $qa, htmlToElement } from '../../utils/domUtils';
import { sleep } from '../../utils/async/sleep';
import { dealDate } from '../../utils/utils';
import { dealImageWidget, insertLoading } from './dealImageWidget';
import { sendFormImg, sendForm } from '../../utils/ajax';
import {
  addPersonRelatedSubject,
  addPersonRelatedCV,
  uploadSubjectCover,
  searchCVByName,
  addMusicEp,
} from './related';
import { getBgmHost, getSubjectId, insertLogInfo, genLinkText } from './common';

function hasCategory(info: SingleInfo, category: string) {
  if (info.category === category) {
    return true;
  }
  return (
    info.category &&
    info.category.includes(',') &&
    info.category.split(',').includes(category)
  );
}

/**
 * 转换 wiki 模式下 infobox 内容
 * @param originValue
 * @param infoArr
 */
export function convertInfoValue(
  originValue: string,
  infoArr: SingleInfo[]
): string {
  let arr = originValue
    .trim()
    .split('\n')
    .filter((v) => !!v);
  // 处理多个.
  const categories = ['website'];
  for (const cat of categories) {
    const infos = infoArr.filter((i) => i.name === cat);
    if (infos.length > 1) {
      const idx = arr.findIndex((v) => v.trim() === `|${cat}=`);
      if (arr.find((v) => v.trim() === `|${cat}={`)) {
        continue;
      }
      if (idx > -1) {
        arr[idx] = `|${cat}={`;
        // arr.splice(idx + 1, 0, '}')
        arr = [...arr.slice(0, idx + 1), '}', ...arr.slice(idx + 1)];
      } else {
        arr = [...arr.slice(0, -1), `|${cat}={`, '}', ...arr.slice(-1)];
      }
    }
  }
  //处理单个但是写成多个.写法有点绕，凑合用吧
  for (const info of infoArr) {
    if (hasCategory(info, 'listItem')) {
      const name = info.name;
      if (arr.find((v) => v.trim() === `|${name}={`)) {
        continue;
      }
      const idx = arr.findIndex((v) => v.trim() === `|${name}=`);
      if (idx > -1) {
        arr[idx] = `|${name}={`;
        arr = [...arr.slice(0, idx + 1), '}', ...arr.slice(idx + 1)];
      } else {
        arr = [...arr.slice(0, -1), `|${name}={`, '}', ...arr.slice(-1)];
      }
    }
  }
  const newArr = [];
  for (const info of infoArr) {
    let isDefault = false;
    for (let i = 0, len = arr.length; i < len; i++) {
      //  |发行日期=  ---> 发行日期
      // [纯假名|] ---> 纯假名
      const m = arr[i].match(/(?:\||\[)(.+?)([|=])/);
      if (!m || m.length < 2) continue;
      const n = m[1];
      if (n === info.name) {
        let d = info.value;
        // 处理时间格式
        if (info.category === 'date') {
          d = dealDate(d);
        }
        // 2024-07-31 去除 ISBN 里面的短横线
        if (info.category === 'ISBN') {
          d = d.replace(/-/g, '');
        }
        // 匹配到 [英文名|]
        if (/\[.+\|\]/.test(arr[i])) {
          arr[i] = arr[i].replace(']', '') + d + ']';
        } else if (/\|.+={/.test(arr[i])) {
          // 避免重复
          if (!originValue.includes(`[${info.value}]`)) {
            // |平台={
            arr[i] = `${arr[i]}\n[${info.value}]`;
          }
        } else {
          // 拼接： |发行日期=2020-01-01
          arr[i] = arr[i].replace(/=[^{[]+/, '=') + d;
        }
        isDefault = true;
        break;
      }
    }
    // 抹去 asin 2020/7/26
    if (!isDefault && info.name && !['asin', 'ASIN'].includes(info.name)) {
      newArr.push(`|${info.name}=${info.value}`);
    }
  }
  arr.pop();
  // 图书条目的 infobox 作者放在出版社之前
  if (/animanga/.test(arr[0])) {
    let pressIdx;
    let authorIdx;
    let resArr = [...arr, ...newArr, '}}'];
    for (let i = 0; i < resArr.length; i++) {
      if (/\|(\s*)出版社(\s*)=/.test(resArr[i])) {
        pressIdx = i;
        continue;
      }
      if (/作者/.test(resArr[i])) {
        authorIdx = i;
        continue;
      }
    }
    if (pressIdx && authorIdx && authorIdx > pressIdx) {
      const press = resArr[pressIdx];
      const author = resArr[authorIdx];
      resArr.splice(pressIdx, 1, author, press);
      resArr.splice(authorIdx + 1, 1);
      return resArr.join('\n');
    }
  }
  return [...arr, ...newArr, '}}'].join('\n');
}

function observerNode($node: HTMLElement): Promise<any> {
  return new Promise<any>((resolve) => {
    const config = { attributes: true, childList: true, subtree: true };
    const observer = new MutationObserver((mutationsList) => {
      observer.disconnect();
      resolve(mutationsList);
    });
    observer.observe($node, config);
  });
}

/**
 * 填写 wiki 表单
 * TODO: 使用 MutationObserver 实现
 * @param wikiData
 */
export async function fillInfoBox(wikiData: SubjectWikiInfo) {
  const dict = {
    誕生日: '生日',
    スリーサイズ: 'BWH',
  } as any;
  const { infos } = wikiData;
  const subType = +wikiData.subtype;
  const infoArray: SingleInfo[] = [];
  const $typeInput: NodeList = $qa(
    'table tr:nth-of-type(2) > td:nth-of-type(2) input'
  );
  if ($typeInput) {
    // @ts-ignore
    $typeInput[0].click();
    if (!isNaN(subType)) {
      // @ts-ignore
      $typeInput[subType].click();
    }
  }
  await sleep(100);

  const $wikiMode = $q(
    'table small a:nth-of-type(1)[href="javascript:void(0)"]'
  ) as HTMLElement;
  const $newbieMode = $q(
    'table small a:nth-of-type(2)[href="javascript:void(0)"]'
  ) as HTMLElement;
  for (let i = 0, len = infos.length; i < len; i++) {
    const currentInfo = infos[i];
    if (infos[i].category === 'subject_title') {
      let $title = $q('input[name=subject_title]') as HTMLInputElement;
      $title.value = (infos[i].value || '').trim();
      continue;
    }
    if (infos[i].category === 'subject_summary') {
      let $summary = $q('#subject_summary') as HTMLInputElement;
      $summary.value = (infos[i].value || '').trim();
      continue;
    }
    if (infos[i].category === 'crt_summary') {
      let $t = $q('#crt_summary') as HTMLInputElement;
      $t.value = (infos[i].value || '').trim();
      continue;
    }
    if (infos[i].category === 'crt_name') {
      let $t = $q('#crt_name') as HTMLInputElement;
      $t.value = (infos[i].value || '').trim();
      continue;
    }
    if (currentInfo.category === 'checkbox') {
      const $t = $q(`input[name=${currentInfo.name}]`) as HTMLInputElement;
      $t.checked = currentInfo.value ? true : false;
      continue;
    }
    // 有名称并且category不在特定列表里面
    if (
      infos[i].name &&
      ['cover', 'crt_cover', 'ep'].indexOf(infos[i].category) === -1
    ) {
      const name = infos[i].name;
      if (dict.hasOwnProperty(name)) {
        infoArray.push({
          ...infos[i],
          name: dict[name],
        });
      } else {
        infoArray.push(infos[i]);
      }
    }
  }
  $wikiMode.click();
  await sleep(200);
  const $infoBox = $q('#subject_infobox') as HTMLTextAreaElement;
  $infoBox.value = convertInfoValue($infoBox.value, infoArray);
  await sleep(200);
  $newbieMode.click();
}

/**
 * 插入控制填表的按钮
 * @param $t 插入按钮的父元素
 * @param cb 填表回调
 * @param cancelCb 清空表单回调
 */
export function insertFillFormBtn(
  $t: Element,
  cb: (...args: any) => any,
  cancelCb: (...args: any) => any
) {
  // 存在节点后，不再插入
  const clx = 'e-wiki-fill-form';
  if ($qa('.' + clx).length >= 2) return;
  const $s = document.createElement('span');
  $s.classList.add(clx);
  $s.innerHTML = 'wiki 填表';
  $t.appendChild($s);
  $s.addEventListener('click', cb);

  const $cancel = $s.cloneNode() as HTMLElement;
  $cancel.innerHTML = '清空';
  $cancel.classList.add(clx + '-cancel');
  $cancel.addEventListener('click', cancelCb);
  $t.appendChild($cancel);
}

function getSubmitBtnText(wikiInfo: SubjectWikiInfo) {
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
export function initNewSubject(wikiInfo: SubjectWikiInfo) {
  const $t = $q('form[name=create_subject] [name=subject_title]').parentElement;
  const defaultVal = ($q('#subject_infobox') as HTMLTextAreaElement).value;
  insertFillFormBtn(
    $t,
    async (e) => {
      await fillInfoBox(wikiInfo);
      const $editSummary = $q('#editSummary') as HTMLInputElement;
      if ($editSummary) {
        $editSummary.value = '新条目';
      }
    },
    () => {
      // 清除默认值
      $qa('input[name=platform]').forEach((element) => {
        (element as HTMLInputElement).checked = false;
      });
      const $wikiMode = $q(
        'table small a:nth-of-type(1)[href="javascript:void(0)"]'
      ) as HTMLElement;
      $wikiMode.click();
      // @ts-ignore
      $q('#subject_infobox').value = defaultVal;
      // @ts-ignore
      $q('#columnInSubjectA [name=subject_title]').value = '';
      // @ts-ignore
      $q('#subject_summary').value = '';
      // 移除上传图片
      ($q('.e-wiki-cover-container .clear-btn') as HTMLInputElement)?.click();
      const $editSummary = $q('#editSummary') as HTMLInputElement;
      if ($editSummary) {
        $editSummary.value = '';
      }
      let customEvent = new CustomEvent<{ type: string }>('scriptMessage', {
        detail: {
          type: 'clearInfo',
        }
      });
      window.dispatchEvent(customEvent);
    }
  );
  const coverInfo = wikiInfo.infos.filter(
    (item: SingleInfo) => item.category === 'cover'
  )[0];
  const dataUrl = coverInfo?.value?.dataUrl || '';
  dealImageWidget($q('form[name=create_subject]'), dataUrl);
  // 修改文本
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
            await uploadSubjectCover(
              subjectId,
              $canvas.toDataURL('image/png', 1)
            );
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

export function initNewCharacter(
  wikiInfo: SubjectWikiInfo,
  subjectId?: string
) {
  const $t = $q('form[name=new_character] #crt_name').parentElement;
  const defaultVal = ($q('#subject_infobox') as HTMLTextAreaElement).value;
  insertFillFormBtn(
    $t,
    async (e) => {
      await fillInfoBox(wikiInfo);
    },
    () => {
      const $wikiMode = $q(
        'table small a:nth-of-type(1)[href="javascript:void(0)"]'
      ) as HTMLElement;
      $wikiMode && $wikiMode.click();
      // @ts-ignore
      $q('#subject_infobox').value = defaultVal;
      // @ts-ignore
      $q('#columnInSubjectA #crt_name').value = '';
      // @ts-ignore
      $q('#crt_summary').value = '';
      // 移除上传图片
      $q('.e-wiki-cover-container')?.remove();
    }
  );
  const coverInfo = wikiInfo.infos.filter(
    (item: SingleInfo) => item.category === 'crt_cover'
  )[0];
  let dataUrl = '';
  if (coverInfo && coverInfo.value) {
    if (typeof coverInfo.value !== 'string') {
      dataUrl = coverInfo?.value?.dataUrl || '';
    } else {
      dataUrl = coverInfo.value;
    }
  }
  const $form = $q('form[name=new_character]') as HTMLFormElement;
  dealImageWidget($form, dataUrl);
  // 修改文本
  setTimeout(() => {
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
              const cvId = await searchCVByName(cvInfo.value, charaId);
              cvId &&
                (await addPersonRelatedCV(
                  subjectId,
                  charaId,
                  [cvId],
                  wikiInfo.type
                ));
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

export function initUploadImg(wikiInfo: SubjectWikiInfo) {
  const coverInfo = wikiInfo.infos.filter(
    (item: SingleInfo) => item.category === 'cover'
  )[0];
  dealImageWidget($q('form[name=img_upload]'), coverInfo?.value?.dataUrl);
}
