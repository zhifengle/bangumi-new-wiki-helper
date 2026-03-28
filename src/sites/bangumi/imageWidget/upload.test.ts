/**
 * @jest-environment jsdom
 */
const mockSendFormImg = jest.fn();
const mockSleep = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../utils/ajax', () => ({
  sendFormImg: mockSendFormImg,
}));

jest.mock('../../../utils/fetchData', () => ({
  fetchText: jest.fn(),
}));

jest.mock('../../../utils/async/sleep', () => ({
  sleep: mockSleep,
}));

import { bindUploadButton } from './upload';

describe('imageWidget upload bindings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
      .mockReturnValue('data:image/png;base64,canvas');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    document.body.innerHTML = `
      <table>
        <tr>
          <td>
            <small>
              <a href="javascript:void(0)">wiki</a>
            </small>
          </td>
        </tr>
      </table>
      <form method="post" action="https://bgm.tv/upload">
        <input type="file" name="picfile" />
        <input type="button" class="upload-btn" value="上传处理后的图片" />
      </form>
    `;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('restores the upload button after a failed upload attempt', async () => {
    const $form = document.querySelector('form') as HTMLFormElement;
    const $file = $form.querySelector('input[type=file]') as HTMLInputElement;
    const $inputBtn = $form.querySelector('.upload-btn') as HTMLInputElement;
    const $canvas = document.createElement('canvas');
    $canvas.width = 40;
    $canvas.height = 60;

    mockSendFormImg.mockRejectedValue(new Error('upload failed'));

    bindUploadButton($file, $inputBtn, $canvas, $form);
    $inputBtn.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSendFormImg).toHaveBeenCalledTimes(1);
    expect($inputBtn.style.display).toBe('');
    expect($form.querySelector('div')).toBeNull();
  });
});
