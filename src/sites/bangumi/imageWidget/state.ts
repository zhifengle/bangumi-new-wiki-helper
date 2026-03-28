interface Pos {
  x: number;
  y: number;
}

export interface BlurControlState {
  width: number;
  radius: number;
}

export type InitialPreviewSource =
  | {
      kind: 'empty';
    }
  | {
      kind: 'data_url';
      dataUrl: string;
    }
  | {
      kind: 'external_url';
      url: string;
    };

export type ResetSource = 'initial' | 'file' | 'fill_form' | 'none';

export function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): Pos {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
    y: ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
  };
}

export function getBlurControlState(
  $width: HTMLInputElement,
  $radius: HTMLInputElement
): BlurControlState {
  return {
    width: +$width.value,
    radius: +$radius.value,
  };
}

export function getBlurAmountText(state: BlurControlState): string {
  return `${state.width}, ${state.radius}`;
}

export function getPasteTipsText(isMouseInPasteArea: boolean): string {
  return isMouseInPasteArea
    ? '可粘贴图片（Ctrl+V）'
    : '鼠标移入此区域后粘贴图片生效';
}

export function resolveInitialPreviewSource(
  base64Data: string
): InitialPreviewSource {
  if (!base64Data) {
    return {
      kind: 'empty',
    };
  }
  if (/^http/.test(base64Data)) {
    return {
      kind: 'external_url',
      url: base64Data,
    };
  }
  return {
    kind: 'data_url',
    dataUrl: base64Data,
  };
}

export function resolveResetSource(
  initialSource: InitialPreviewSource,
  hasFile: boolean,
  hasFillForm: boolean
): ResetSource {
  if (initialSource.kind !== 'empty') return 'initial';
  if (hasFile) return 'file';
  if (hasFillForm) return 'fill_form';
  return 'none';
}

export function hasValidCanvasSize($canvas: HTMLCanvasElement): boolean {
  return $canvas.width > 8 && $canvas.height > 10;
}
