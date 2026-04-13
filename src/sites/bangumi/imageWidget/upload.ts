import { sendFormImg } from '../../../utils/ajax';
import { fetchText } from '../../../utils/fetchData';
import { sleep } from '../../../utils/async/sleep';
import { hasValidCanvasSize } from './state';

export function insertLoading($sibling: Element): HTMLDivElement {
  const $loading = document.createElement('div');
  $loading.setAttribute(
    'style',
    'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");'
  );
  $sibling.parentElement.insertBefore($loading, $sibling);
  return $loading;
}

export function bindUploadButton(
  $file: HTMLInputElement | null,
  $inputBtn: HTMLInputElement,
  $canvas: HTMLCanvasElement,
  $form: HTMLFormElement
) {
  if ($file) {
    const handleClick = async (e: Event) => {
      e.preventDefault();
      if (!hasValidCanvasSize($canvas)) {
        return;
      }
      const $el = e.target as HTMLElement;
      $el.style.display = 'none';
      const $loading = insertLoading($el);
      try {
        const $wikiMode = document.querySelector(
          'table small a:nth-of-type(1)[href="javascript:void(0)"]'
        ) as HTMLElement | null;
        $wikiMode?.click();
        await sleep(200);
        const url = await sendFormImg($form, $canvas.toDataURL('image/png', 1));
        location.assign(url);
      } catch (e) {
        console.log('send form err: ', e);
      } finally {
        $el.style.display = '';
        $loading.remove();
      }
    };

    $inputBtn.addEventListener('click', handleClick, false);
    return () => {
      $inputBtn.removeEventListener('click', handleClick, false);
    };
  }

  $inputBtn.value = '处理图片';
  return () => undefined;
}

function getPreviewCanvas() {
  const $canvas = document.querySelector('#e-wiki-cover-preview');
  if ($canvas instanceof HTMLCanvasElement) {
    return $canvas;
  }
  return null;
}

/**
 * upload image form on bangumi.tv
 * @param subjectId
 */
export async function uploadImage(subjectId: string) {
  const d = await fetchText(`/${subjectId}/upload_img`, {}, 3000);
  const $canvas = getPreviewCanvas();

  const $doc = new DOMParser().parseFromString(d, 'text/html');
  const $form: HTMLFormElement | null = $doc.querySelector('form[name=img_upload]');
  if (!$form || !$canvas) {
    return;
  }

  if (hasValidCanvasSize($canvas)) {
    const url = await sendFormImg($form, $canvas.toDataURL('image/png', 1));
    location.assign(url);
  }
}
