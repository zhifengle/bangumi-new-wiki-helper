import {
  getBlurAmountText,
  getBlurControlState,
  getMousePos,
  getPasteTipsText,
  hasValidCanvasSize,
  resolveInitialPreviewSource,
  resolveResetSource,
} from './state';

describe('imageWidget state helpers', () => {
  test('getBlurControlState and getBlurAmountText', () => {
    const $width = { value: '20' } as any;
    const $radius = { value: '8' } as any;
    const state = getBlurControlState($width as HTMLInputElement, $radius as HTMLInputElement);
    expect(state).toEqual({ width: 20, radius: 8 });
    expect(getBlurAmountText(state)).toBe('20, 8');
  });

  test('getPasteTipsText', () => {
    expect(getPasteTipsText(true)).toBe('可粘贴图片（Ctrl+V）');
    expect(getPasteTipsText(false)).toBe('鼠标移入此区域后粘贴图片生效');
  });

  test('resolveInitialPreviewSource', () => {
    expect(resolveInitialPreviewSource('')).toEqual({
      kind: 'empty',
    });
    expect(resolveInitialPreviewSource('https://example.com/cover.jpg')).toEqual({
      kind: 'external_url',
      url: 'https://example.com/cover.jpg',
    });
    expect(resolveInitialPreviewSource('data:image/png;base64,cover')).toEqual({
      kind: 'data_url',
      dataUrl: 'data:image/png;base64,cover',
    });
  });

  test('resolveResetSource priority', () => {
    expect(
      resolveResetSource(
        {
          kind: 'data_url',
          dataUrl: 'base64',
        },
        true,
        true
      )
    ).toBe('initial');
    expect(resolveResetSource({ kind: 'empty' }, true, true)).toBe('file');
    expect(resolveResetSource({ kind: 'empty' }, false, true)).toBe('fill_form');
    expect(resolveResetSource({ kind: 'empty' }, false, false)).toBe('none');
  });

  test('hasValidCanvasSize', () => {
    const $canvas = { width: 9, height: 11 } as any;
    expect(hasValidCanvasSize($canvas)).toBe(true);
    $canvas.width = 8;
    $canvas.height = 10;
    expect(hasValidCanvasSize($canvas)).toBe(false);
  });

  test('getMousePos', () => {
    const $canvas = {
      width: 100,
      height: 200,
      getBoundingClientRect: () => ({
        left: 10,
        right: 110,
        top: 20,
        bottom: 220,
      }),
    } as any;
    const evt = {
      clientX: 60,
      clientY: 120,
    } as any;
    expect(getMousePos($canvas as HTMLCanvasElement, evt as MouseEvent)).toEqual({
      x: 50,
      y: 100,
    });
  });
});
