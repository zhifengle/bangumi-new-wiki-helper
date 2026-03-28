import { htmlToElement } from '../../utils/domUtils';

export type SubjectControlHandler = (
  event: MouseEvent,
  shouldCheckDup?: boolean
) => Promise<void>;

export type CharacterControlHandler = (event: MouseEvent) => Promise<void>;

export type CharacterSelectionHandler = (
  event: MouseEvent,
  selectedName: string
) => Promise<void>;

/**
 * 插入控制的按钮
 * @param $t 父节点
 * @param cb 返回 Promise 的回调
 */
export function insertControlBtn($t: Element, cb: SubjectControlHandler) {
  if (!$t) return;
  const $div = document.createElement('div');
  const $s = document.createElement('span');
  $s.classList.add('e-wiki-new-subject');
  $s.innerHTML = '新建';
  const $search = $s.cloneNode() as HTMLSpanElement;
  $search.innerHTML = '新建并查重';
  $div.appendChild($s);
  $div.appendChild($search);
  $t.insertAdjacentElement('afterend', $div);
  $s.addEventListener('click', async (e) => {
    await cb(e);
  });
  $search.addEventListener('click', async (e) => {
    if ($search.innerHTML !== '新建并查重') return;
    $search.innerHTML = '查重中...';
    try {
      await cb(e, true);
      $search.innerHTML = '新建并查重';
    } catch (e) {
      if (e === 'notmatched') {
        $search.innerHTML = '未查到条目';
      }
      console.error(e);
    }
  });
}

/**
 * 插入新建角色控制的按钮
 * @param $t 父节点
 * @param cb 返回 Promise 的回调
 */
export function insertControlBtnChara($t: Element, cb: CharacterControlHandler) {
  if (!$t) return;
  const $div = document.createElement('div');
  const $s = document.createElement('a');
  $s.classList.add('e-wiki-new-character');
  // $s.setAttribute('target', '_blank')
  $s.innerHTML = '添加新虚拟角色';
  $div.appendChild($s);
  $t.insertAdjacentElement('afterend', $div);
  $s.addEventListener('click', async (e) => {
    await cb(e);
  });
}

export function addCharaUI(
  $t: Element,
  names: string[],
  cb: CharacterSelectionHandler
) {
  if (!$t) return;
  if (!names.length) {
    console.warn('没有虚拟角色可用');
    return;
  }
  // @TODO 增加全部
  // <option value="all">全部</option>
  const btn = `<a class="e-wiki-new-character">添加新虚拟角色</a>`;
  const $div = htmlToElement<HTMLDivElement>(`
  <div class="e-bnwh-add-chara-wrap">
  ${btn}
<select class="e-bnwh-select">
${names.map((n) => `<option value="${n}">${n}</option>`)}
</select>
  </div>
  `);
  $t.insertAdjacentElement('afterend', $div);
  const $button = $div.querySelector<HTMLAnchorElement>('.e-wiki-new-character');
  const $sel = $div.querySelector<HTMLSelectElement>('.e-bnwh-select');
  if (!$button || !$sel) {
    return;
  }
  $button.addEventListener('click', async (e) => {
    await cb(e, $sel.value);
  });
}
