// @vitest-environment jsdom
import { vi } from 'vitest';

const { mockFetchBinary } = vi.hoisted(() => ({
  mockFetchBinary: vi.fn(),
}));

vi.mock('./fetchData', () => ({
  fetchBinary: mockFetchBinary,
}));

import {
  convertImgToBase64,
  dataURItoBlob,
  getImageBase64,
  getImageDataByURL,
} from './dealImage';

describe('dealImage helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('dataURItoBlob converts base64 strings into typed blobs', async () => {
    const blob = dataURItoBlob('data:text/plain;base64,SGVsbG8=');

    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(5);
  });

  test('getImageDataByURL reads fetched blobs as data urls', async () => {
    mockFetchBinary.mockResolvedValue(
      new Blob(['cover'], {
        type: 'image/png',
      })
    );

    const dataUrl = await getImageDataByURL('https://example.com/cover.png');

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(mockFetchBinary).toHaveBeenCalledWith(
      'https://example.com/cover.png',
      {}
    );
  });

  test('getImageBase64 normalizes mime type using the image suffix', async () => {
    mockFetchBinary.mockResolvedValue(
      new Blob(['cover'], {
        type: 'application/octet-stream',
      })
    );

    const dataUrl = await getImageBase64('https://example.com/cover.jpg');

    expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
  });

  test('convertImgToBase64 renders the image onto a canvas', () => {
    const drawImage = vi.fn();
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        drawImage,
      } as unknown as CanvasRenderingContext2D);
    const toDataURLSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/png;base64,canvas');
    const image = document.createElement('img');

    Object.defineProperty(image, 'width', {
      value: 12,
      configurable: true,
    });
    Object.defineProperty(image, 'height', {
      value: 18,
      configurable: true,
    });

    expect(convertImgToBase64(image)).toBe('data:image/png;base64,canvas');
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 12, 18);

    getContextSpy.mockRestore();
    toDataURLSpy.mockRestore();
  });
});
