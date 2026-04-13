import * as StackBlur from 'stackblur-canvas';
import {
  getBlurAmountText,
  getBlurControlState,
  getMousePos,
  getPasteTipsText,
} from './state';

export interface ImageWidgetRefs {
  container: HTMLDivElement;
  submitButton: HTMLInputElement;
  previewCanvas: HTMLCanvasElement;
  amountInput: HTMLInputElement;
  widthSlider: HTMLInputElement;
  widthPreviewCanvas: HTMLCanvasElement;
  radiusSlider: HTMLInputElement;
  resetButton: HTMLInputElement;
  clearButton: HTMLInputElement;
  pasteTips: HTMLDivElement;
  previewImage: HTMLImageElement;
  previewFetchLink: HTMLAnchorElement | null;
}

function queryRequiredElement<E extends Element>(root: ParentNode, selector: string): E {
  const element = root.querySelector<E>(selector);
  if (!element) {
    throw new Error(`missing imageWidget element: ${selector}`);
  }
  return element;
}

function drawRec($width: HTMLInputElement, $canvas: HTMLCanvasElement) {
  const ctx = $canvas.getContext('2d');
  if (!ctx) {
    return;
  }
  const width = Number($width.value);
  $canvas.width = width * 1.4;
  $canvas.height = width * 1.4;
  ctx.strokeStyle = '#f09199';
  ctx.strokeRect(0.2 * width, 0.2 * width, width, width);
  // resize page
  window.dispatchEvent(new Event('resize'));
}

function changeInfo(
  $info: HTMLInputElement,
  $width: HTMLInputElement,
  $radius: HTMLInputElement
) {
  const state = getBlurControlState($width, $radius);
  $info.value = getBlurAmountText(state);
}

export function createImageWidgetEditor(
  $target: HTMLElement
): ImageWidgetRefs | null {
  const rawHTML = `
    <input style="vertical-align: top;" class="inputBtn submit-btn" value="上传处理后的图片" name="submit" type="button">
    <canvas id="e-wiki-cover-preview" width="8" height="10"></canvas>
    <br>
    <label for="e-wiki-cover-amount">Blur width and radius:</label>
    <input id="e-wiki-cover-amount" type="text" readonly>
    <br>
    <input id="e-wiki-cover-slider-width" type="range" value="20" name="width" min="1" max="100">
    <canvas class="blur-width-preview"></canvas>
    <br>
    <input id="e-wiki-cover-slider-radius" type="range" value="20" name="radius" min="1" max="100">
    <br>
    <div class="canvas-btn-container" style="display: flex; align-items: center; gap: 10px; margin-top: 10px">
      <input class="inputBtn reset-btn" value="重置" type="button">
      <input class="inputBtn clear-btn" value="清除" type="button">
    </div>
    <div class="paste-tips" style="margin-top: 10px; color: #999;font-size: 12px">${getPasteTipsText(false)}</div>
    <img class="preview" src="" alt="" style="display:none;">
  `;
  const $info = document.createElement('div');
  $info.classList.add('e-wiki-cover-container');
  $info.innerHTML = rawHTML;
  if (!$target.parentElement) {
    return null;
  }
  $target.parentElement.insertBefore($info, $target.nextElementSibling);

  const refs: ImageWidgetRefs = {
    container: $info,
    submitButton: queryRequiredElement<HTMLInputElement>($info, '.submit-btn'),
    previewCanvas: queryRequiredElement<HTMLCanvasElement>(
      $info,
      '#e-wiki-cover-preview'
    ),
    amountInput: queryRequiredElement<HTMLInputElement>(
      $info,
      '#e-wiki-cover-amount'
    ),
    widthSlider: queryRequiredElement<HTMLInputElement>(
      $info,
      '#e-wiki-cover-slider-width'
    ),
    widthPreviewCanvas: queryRequiredElement<HTMLCanvasElement>(
      $info,
      '.blur-width-preview'
    ),
    radiusSlider: queryRequiredElement<HTMLInputElement>(
      $info,
      '#e-wiki-cover-slider-radius'
    ),
    resetButton: queryRequiredElement<HTMLInputElement>($info, '.reset-btn'),
    clearButton: queryRequiredElement<HTMLInputElement>($info, '.clear-btn'),
    pasteTips: queryRequiredElement<HTMLDivElement>($info, '.paste-tips'),
    previewImage: queryRequiredElement<HTMLImageElement>($info, 'img.preview'),
    previewFetchLink: null,
  };

  drawRec(refs.widthSlider, refs.widthPreviewCanvas);
  changeInfo(refs.amountInput, refs.widthSlider, refs.radiusSlider);
  refs.widthSlider.addEventListener('input', () => {
    drawRec(refs.widthSlider, refs.widthPreviewCanvas);
    changeInfo(refs.amountInput, refs.widthSlider, refs.radiusSlider);
  });
  refs.radiusSlider.addEventListener('input', () => {
    changeInfo(refs.amountInput, refs.widthSlider, refs.radiusSlider);
  });
  return refs;
}

/**
 * blur canvas
 * @param el target canvas
 * @param width blur rect width
 * @param radius blur rect height
 */
export function bindCanvasBlur(
  refs: Pick<ImageWidgetRefs, 'previewCanvas' | 'widthSlider' | 'radiusSlider'>
): () => void {
  let isDrawing = false;
  const ctx = refs.previewCanvas.getContext('2d');
  if (!ctx) {
    return () => undefined;
  }

  const handleMouseDown = (e: MouseEvent) => {
    isDrawing = true;
    const pos = getMousePos(refs.previewCanvas, e);
    ctx.moveTo(pos.x, pos.y);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDrawing) {
      const pos = getMousePos(refs.previewCanvas, e);
      const { width, radius } = getBlurControlState(
        refs.widthSlider,
        refs.radiusSlider
      );
      // stack blur operation
      StackBlur.canvasRGBA(
        refs.previewCanvas,
        pos.x - width / 2,
        pos.y - width / 2,
        width,
        width,
        radius
      );
    }
  };

  const stopDrawing = () => {
    isDrawing = false;
  };

  refs.previewCanvas.addEventListener('mousedown', handleMouseDown);
  refs.previewCanvas.addEventListener('mousemove', handleMouseMove);
  refs.previewCanvas.addEventListener('mouseup', stopDrawing);
  refs.previewCanvas.addEventListener('mouseleave', stopDrawing);
  window.addEventListener('mouseup', stopDrawing);

  return () => {
    refs.previewCanvas.removeEventListener('mousedown', handleMouseDown);
    refs.previewCanvas.removeEventListener('mousemove', handleMouseMove);
    refs.previewCanvas.removeEventListener('mouseup', stopDrawing);
    refs.previewCanvas.removeEventListener('mouseleave', stopDrawing);
    window.removeEventListener('mouseup', stopDrawing);
  };
}
