import { $qa } from '../../../utils/domUtils';

export type FillFormButtonHandler = (
  event: MouseEvent
) => void | Promise<void>;

/**
 * 插入控制填表的按钮
 * @param $t 插入按钮的父元素
 * @param cb 填表回调
 * @param cancelCb 清空表单回调
 */
export function insertFillFormBtn(
  $t: Element,
  cb: FillFormButtonHandler,
  cancelCb: FillFormButtonHandler
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
