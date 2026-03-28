import {
  applyInitialPreviewData,
  bindPastePreview,
  bindPreviewControls,
  bindPreviewFileImage,
} from './preview';
import { bindCanvasBlur, createImageWidgetEditor } from './editor';
import { bindUploadButton } from './upload';
import { resolveInitialPreviewSource } from './state';

export { insertLoading, uploadImage } from './upload';

type ImageWidgetInstance = {
  container: HTMLDivElement;
  dispose: () => void;
};

const imageWidgetInstances = new WeakMap<HTMLFormElement, ImageWidgetInstance>();

/**
 * 初始化上传处理图片组件
 * @param {Object} $form - 包含 input file 的 DOM
 * @param {string} base64Data - 图片链接或者 base64 信息
 */
export function initImageWidget(
  $form: HTMLFormElement,
  base64Data: string
) {
  const currentInstance = imageWidgetInstances.get($form);
  if (currentInstance?.container.isConnected) {
    return;
  }
  currentInstance?.dispose();
  imageWidgetInstances.delete($form);

  if (document.querySelector('.e-wiki-cover-container')) return;

  const refs = createImageWidgetEditor($form);
  if (!refs) {
    return;
  }

  const initialSource = resolveInitialPreviewSource(base64Data);
  const $file = $form.querySelector<HTMLInputElement>('input[type = file]');

  const disposePreviewFile = bindPreviewFileImage($file, refs);
  applyInitialPreviewData(initialSource, refs);
  const disposeCanvasBlur = bindCanvasBlur(refs);
  const disposePreviewControls = bindPreviewControls(initialSource, $file, refs);
  const disposePastePreview = bindPastePreview(refs);
  const disposeUploadButton = bindUploadButton(
    $file,
    refs.submitButton,
    refs.previewCanvas,
    $form
  );

  imageWidgetInstances.set($form, {
    container: refs.container,
    dispose: () => {
      disposePreviewFile();
      disposeCanvasBlur();
      disposePreviewControls();
      disposePastePreview();
      disposeUploadButton();
    },
  });
}
