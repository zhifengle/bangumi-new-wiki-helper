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

export type ExportControlHandler = (event: MouseEvent) => Promise<void>;

export type ControlButtonLabels = {
  create: string;
  createWithCheck: string;
};

const DEFAULT_CONTROL_LABELS: ControlButtonLabels = {
  create: '新建',
  createWithCheck: '新建并查重',
};

const EXPORT_LABEL = '导出 JSON';
const EXPORTING_LABEL = '导出中...';

/**
 * 插入控制的按钮
 * @param $t 父节点
 * @param cb 返回 Promise 的回调
 * @param labels 按钮文案，人物等其他来源可以换掉默认的条目文案
 */
export function insertControlBtn(
  $t: Element,
  cb: SubjectControlHandler,
  labels: ControlButtonLabels = DEFAULT_CONTROL_LABELS
) {
  if (!$t) return;
  const $div = document.createElement('div');
  const $s = document.createElement('span');
  $s.classList.add('e-wiki-new-subject');
  $s.innerHTML = labels.create;
  const $search = $s.cloneNode() as HTMLSpanElement;
  $search.innerHTML = labels.createWithCheck;
  $div.appendChild($s);
  $div.appendChild($search);
  $t.insertAdjacentElement('afterend', $div);
  $s.addEventListener('click', async (e) => {
    await cb(e);
  });
  $search.addEventListener('click', async (e) => {
    if ($search.innerHTML !== labels.createWithCheck) return;
    $search.innerHTML = '查重中...';
    try {
      await cb(e, true);
    } catch (e) {
      if (e === 'notmatched') {
        $search.innerHTML = '未查到条目';
      }
      console.error(e);
    } finally {
      if ($search.innerHTML === '查重中...') {
        $search.innerHTML = labels.createWithCheck;
      }
    }
  });
  return $div;
}

/**
 * 在控制按钮容器里追加「导出 JSON」按钮
 * @param $container insertControlBtn 等返回的容器
 * @param cb 返回 Promise 的回调
 */
export function appendExportBtn($container: Element, cb: ExportControlHandler) {
  if (!$container) return;
  const $s = document.createElement('span');
  $s.classList.add('e-wiki-new-subject', 'e-wiki-export-json');
  $s.textContent = EXPORT_LABEL;
  $container.appendChild($s);
  $s.addEventListener('click', async (e) => {
    if ($s.textContent !== EXPORT_LABEL) return;
    $s.textContent = EXPORTING_LABEL;
    try {
      await cb(e);
    } catch (error) {
      console.error(error);
    } finally {
      $s.textContent = EXPORT_LABEL;
    }
  });
  return $s;
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
  return $div;
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
    return $div;
  }
  $button.addEventListener('click', async (e) => {
    await cb(e, $sel.value);
  });
  return $div;
}
