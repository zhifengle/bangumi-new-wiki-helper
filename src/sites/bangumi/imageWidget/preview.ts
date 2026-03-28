import type { ImageWidgetRefs } from './editor';
import {
  type InitialPreviewSource,
  getPasteTipsText,
  resolveResetSource,
} from './state';

type PreviewLinkRefs = Pick<
  ImageWidgetRefs,
  'container' | 'previewCanvas' | 'previewImage' | 'previewFetchLink'
>;

function clearPreviewCanvas($canvas: HTMLCanvasElement) {
  $canvas.width = 0;
  $canvas.height = 0;
}

function removePreviewFetchLink(refs: PreviewLinkRefs) {
  refs.previewFetchLink?.remove();
  refs.previewFetchLink = null;
}

function ensurePreviewFetchLink(refs: PreviewLinkRefs, url: string) {
  if (refs.previewFetchLink?.href === url) {
    return;
  }
  removePreviewFetchLink(refs);
  const link = document.createElement('a');
  link.classList.add('preview-fetch-img-link');
  link.href = url;
  link.setAttribute('rel', 'noopener noreferrer nofollow');
  link.setAttribute('target', '_blank');
  link.innerText = '查看抓取封面';
  refs.container.insertBefore(link, refs.previewCanvas);
  refs.previewFetchLink = link;
}

function getPreviewImageSize($img: HTMLImageElement) {
  return {
    width: $img.naturalWidth || $img.width,
    height: $img.naturalHeight || $img.height,
  };
}

function renderPreviewImage(refs: Pick<ImageWidgetRefs, 'previewCanvas' | 'previewImage'>) {
  const ctx = refs.previewCanvas.getContext('2d');
  if (!ctx) {
    return;
  }
  const { width, height } = getPreviewImageSize(refs.previewImage);
  if (!width || !height) {
    return;
  }
  refs.previewCanvas.width = width;
  refs.previewCanvas.height = height;
  ctx.drawImage(refs.previewImage, 0, 0);
  window.dispatchEvent(new Event('resize'));
}

function loadPreviewImageSource(
  refs: Pick<ImageWidgetRefs, 'previewCanvas' | 'previewImage'>,
  dataUrl: string
) {
  if (refs.previewImage.src === dataUrl) {
    renderPreviewImage(refs);
    return;
  }
  refs.previewImage.src = dataUrl;
}

export function applyInitialPreviewData(
  initialSource: InitialPreviewSource,
  refs: PreviewLinkRefs
) {
  if (initialSource.kind === 'empty') {
    removePreviewFetchLink(refs);
    return;
  }
  if (initialSource.kind === 'external_url') {
    // 跨域和 refer 的问题，暂时改成链接
    ensurePreviewFetchLink(refs, initialSource.url);
    clearPreviewCanvas(refs.previewCanvas);
    refs.previewImage.removeAttribute('src');
  } else {
    removePreviewFetchLink(refs);
    loadPreviewImageSource(refs, initialSource.dataUrl);
  }
}

export function bindPreviewFileImage(
  $file: HTMLInputElement | null,
  refs: Pick<ImageWidgetRefs, 'previewCanvas' | 'previewImage'>
) {
  const handleImageLoad = () => {
    renderPreviewImage(refs);
  };

  refs.previewImage.addEventListener('load', handleImageLoad);
  if ($file) {
    const loadImgData = () => {
      const file = $file.files?.[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (typeof reader.result === 'string') {
          loadPreviewImageSource(refs, reader.result);
        }
      });
      reader.readAsDataURL(file);
    };

    $file.addEventListener('change', loadImgData);
    return () => {
      refs.previewImage.removeEventListener('load', handleImageLoad);
      $file.removeEventListener('change', loadImgData);
    };
  }

  return () => {
    refs.previewImage.removeEventListener('load', handleImageLoad);
  };
}

export function bindPreviewControls(
  initialSource: InitialPreviewSource,
  $file: HTMLInputElement | null,
  refs: Pick<
    ImageWidgetRefs,
    'resetButton' | 'clearButton' | 'previewCanvas' | 'previewImage' | 'container' | 'previewFetchLink'
  >
) {
  const handleReset = (e: Event) => {
    // wiki 填表按钮
    const $fillForm = document.querySelector<HTMLElement>('.e-wiki-fill-form');
    const resetSource = resolveResetSource(
      initialSource,
      Boolean($file?.files?.[0]),
      Boolean($fillForm)
    );
    if (resetSource === 'initial') {
      applyInitialPreviewData(initialSource, refs);
    } else if (resetSource === 'file') {
      $file?.dispatchEvent(new Event('change'));
    } else if (resetSource === 'fill_form') {
      $fillForm?.dispatchEvent(new Event('click'));
    }
    e.preventDefault();
  };

  const handleClear = (e: Event) => {
    clearPreviewCanvas(refs.previewCanvas);
    e.preventDefault();
  };

  refs.resetButton.addEventListener('click', handleReset);
  refs.clearButton.addEventListener('click', handleClear);

  return () => {
    refs.resetButton.removeEventListener('click', handleReset);
    refs.clearButton.removeEventListener('click', handleClear);
  };
}

export function bindPastePreview(
  refs: Pick<
    ImageWidgetRefs,
    'container' | 'pasteTips' | 'previewImage' | 'previewCanvas'
  >
) {
  // 标记：鼠标是否在目标元素内（初始为false）
  let isMouseInPasteArea = false;
  // 监听鼠标进入/离开，更新状态 + 视觉反馈
  const handleMouseEnter = () => {
    isMouseInPasteArea = true;
    refs.pasteTips.textContent = getPasteTipsText(true);
  };

  const handleMouseLeave = () => {
    isMouseInPasteArea = false;
    refs.pasteTips.textContent = getPasteTipsText(false);
  };

  const handlePaste = (e: ClipboardEvent) => {
    if (!refs.container.isConnected) {
      document.body.removeEventListener('paste', handlePaste);
      return;
    }
    if (!isMouseInPasteArea) return;
    e.preventDefault();
    let imageFile = null;
    if (e.clipboardData && e.clipboardData.files) {
      imageFile = e.clipboardData.files[0];
    } else if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          imageFile = item.getAsFile(); // 转换为File对象
          break;
        }
      }
    }
    if (!imageFile) {
      refs.pasteTips.textContent = '未检测到图片！';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const pasteBase64Data = event.target?.result;
      if (typeof pasteBase64Data === 'string') {
        loadPreviewImageSource(refs, pasteBase64Data);
      }
    });
    reader.readAsDataURL(imageFile);
  };

  refs.container.addEventListener('mouseenter', handleMouseEnter);
  refs.container.addEventListener('mouseleave', handleMouseLeave);
  document.body.addEventListener('paste', handlePaste);

  return () => {
    refs.container.removeEventListener('mouseenter', handleMouseEnter);
    refs.container.removeEventListener('mouseleave', handleMouseLeave);
    document.body.removeEventListener('paste', handlePaste);
  };
}
