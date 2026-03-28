/**
 * @jest-environment jsdom
 */
import { createImageWidgetEditor } from './editor';
import { applyInitialPreviewData, bindPreviewControls } from './preview';
import { resolveInitialPreviewSource } from './state';

function installCanvasContextMock() {
  return jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(() => {
      return {
        drawImage: jest.fn(),
        moveTo: jest.fn(),
        strokeRect: jest.fn(),
      } as unknown as CanvasRenderingContext2D;
    });
}

describe('imageWidget preview bindings', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form name="img_upload">
        <input type="file" name="picfile" />
      </form>
    `;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('reset restores external preview state instead of keeping the current image', () => {
    installCanvasContextMock();
    const $form = document.querySelector('form') as HTMLFormElement;
    const refs = createImageWidgetEditor($form);
    expect(refs).not.toBeNull();
    if (!refs) {
      return;
    }

    const initialSource = resolveInitialPreviewSource(
      'https://example.com/fetched-cover.jpg'
    );
    applyInitialPreviewData(initialSource, refs);
    refs.previewCanvas.width = 120;
    refs.previewCanvas.height = 90;
    refs.previewImage.setAttribute('src', 'data:image/png;base64,current-image');

    const dispose = bindPreviewControls(initialSource, null, refs);
    refs.resetButton.click();

    expect(refs.previewCanvas.width).toBe(0);
    expect(refs.previewCanvas.height).toBe(0);
    expect(refs.previewImage.getAttribute('src')).toBeNull();
    expect(
      refs.container.querySelector<HTMLAnchorElement>('.preview-fetch-img-link')
        ?.href
    ).toBe('https://example.com/fetched-cover.jpg');

    dispose();
  });

  test('reset restores the initial data url when preview content changes', () => {
    installCanvasContextMock();
    const $form = document.querySelector('form') as HTMLFormElement;
    const refs = createImageWidgetEditor($form);
    expect(refs).not.toBeNull();
    if (!refs) {
      return;
    }

    const initialSource = resolveInitialPreviewSource(
      'data:image/png;base64,initial-image'
    );
    refs.previewImage.src = 'data:image/png;base64,current-image';

    const dispose = bindPreviewControls(initialSource, null, refs);
    refs.resetButton.click();

    expect(refs.previewImage.src).toBe('data:image/png;base64,initial-image');

    dispose();
  });
});
