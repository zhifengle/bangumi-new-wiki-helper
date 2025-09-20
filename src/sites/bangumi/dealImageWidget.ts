import * as StackBlur from 'stackblur-canvas';
import { sendFormImg } from '../../utils/ajax';
import { fetchText } from '../../utils/fetchData';
import { sleep } from '../../utils/async/sleep';

interface Pos {
  x: number;
  y: number;
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): Pos {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) / (rect.right - rect.left)) * canvas.width,
    y: ((evt.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height,
  };
}

/**
 * blur canvas
 * @param el target canvas
 * @param width blur rect width
 * @param radius blur rect height
 */
function blur(el: HTMLCanvasElement) {
  let isDrawing = false;
  let ctx = el.getContext('2d');

  el.onmousedown = function (e: MouseEvent) {
    isDrawing = true;
    const pos = getMousePos(el, e);
    ctx.moveTo(pos.x, pos.y);
  };
  const $width: HTMLInputElement = document.querySelector(
    '#e-wiki-cover-slider-width'
  );
  const $radius: HTMLInputElement = document.querySelector(
    '#e-wiki-cover-slider-radius'
  );
  el.onmousemove = function (e: MouseEvent) {
    if (isDrawing) {
      const pos = getMousePos(el, e);
      const width = +$width.value;
      const radius = +$radius.value;
      // stack blur operation
      StackBlur.canvasRGBA(
        el,
        pos.x - width / 2,
        pos.y - width / 2,
        width,
        width,
        radius
      );
    }
  };
  el.onmouseup = function () {
    isDrawing = false;
  };
}

function initContainer($target: HTMLElement) {
  const rawHTML = `
    <input style="vertical-align: top;" class="inputBtn" value="上传处理后的图片" name="submit" type="button">
    <canvas id="e-wiki-cover-preview" width="8" height="10"></canvas>
    <br>
    <label for="e-wiki-cover-amount">Blur width and radius:</label>
    <input id="e-wiki-cover-amount" type="text" readonly>
    <br>
    <input id="e-wiki-cover-slider-width" type="range" value="20" name="width" min="1" max="100">
    <canvas></canvas>
    <br>
    <input id="e-wiki-cover-slider-radius" type="range" value="20" name="radius" min="1" max="100">
    <br>
    <div class="canvas-btn-container" style="display: flex; align-items: center; gap: 10px; margin-top: 10px">
      <input class="inputBtn reset-btn" value="重置" type="button">
      <input class="inputBtn clear-btn" value="清除" type="button">
    </div>
    <img class="preview" src="" alt="" style="display:none;">
  `;
  const $info = document.createElement('div');
  $info.classList.add('e-wiki-cover-container');
  $info.innerHTML = rawHTML;
  $target.parentElement.insertBefore($info, $target.nextElementSibling);
  const $width: HTMLInputElement = document.querySelector(
    '#e-wiki-cover-slider-width'
  );
  const $radius: HTMLInputElement = document.querySelector(
    '#e-wiki-cover-slider-radius'
  );
  drawRec($width);
  changeInfo($width, $radius);
  $width.addEventListener('change', (e) => {
    drawRec($width);
    changeInfo($width, $radius);
  });
  $radius.addEventListener('change', (e) => {
    changeInfo($width, $radius);
  });
}

function drawRec($width: HTMLInputElement) {
  // TODO: canvas type
  const $canvas: any = $width.nextElementSibling;
  const ctx = $canvas.getContext('2d');
  const width = Number($width.value);
  $canvas.width = width * 1.4;
  $canvas.height = width * 1.4;
  ctx.strokeStyle = '#f09199';
  ctx.strokeRect(0.2 * width, 0.2 * width, width, width);
  // resize page
  window.dispatchEvent(new Event('resize'));
}

function changeInfo($width: HTMLInputElement, $radius: HTMLInputElement) {
  var $info: HTMLInputElement = document.querySelector('#e-wiki-cover-amount');
  var radius = $radius.value;
  var width = $width.value;
  $info.value = width + ', ' + radius;
}

function previewFileImage(
  $file: HTMLInputElement,
  $canvas: HTMLCanvasElement,
  $img = new Image()
) {
  const ctx = $canvas.getContext('2d');
  $img.addEventListener(
    'load',
    function () {
      $canvas.width = $img.width;
      $canvas.height = $img.height;
      ctx.drawImage($img, 0, 0);
      window.dispatchEvent(new Event('resize')); // let img cut tool at right position
    },
    false
  );

  function loadImgData() {
    var file = $file.files[0];
    var reader = new FileReader();
    reader.addEventListener(
      'load',
      function () {
        $img.src = reader.result as any;
      },
      false
    );
    if (file) {
      reader.readAsDataURL(file);
    }
  }

  if ($file) {
    $file.addEventListener('change', loadImgData, false);
  }
}

/**
 * 初始化上传处理图片组件
 * @param {Object} $form - 包含 input file 的 DOM
 * @param {string} base64Data - 图片链接或者 base64 信息
 */
export async function dealImageWidget(
  $form: HTMLFormElement,
  base64Data: string
) {
  if (document.querySelector('.e-wiki-cover-container')) return;
  initContainer($form);
  const $canvas: HTMLCanvasElement = document.querySelector(
    '#e-wiki-cover-preview'
  );
  const $img: HTMLImageElement = document.querySelector(
    '.e-wiki-cover-container img.preview'
  );
  if (base64Data) {
    if (base64Data.match(/^http/)) {
      // 跨域和refer 的问题，暂时改成链接
      // base64Data = await getImageDataByURL(base64Data);
      const link = document.createElement('a');
      link.classList.add('preview-fetch-img-link');
      link.href = base64Data;
      link.setAttribute('rel', 'noopener noreferrer nofollow');
      link.setAttribute('target', '_blank');
      link.innerText = '查看抓取封面';
      document
        .querySelector('.e-wiki-cover-container')
        .insertBefore(link, document.querySelector('#e-wiki-cover-preview'));
    } else {
      $img.src = base64Data;
    }
  }
  const $file: HTMLInputElement = $form.querySelector('input[type = file]');
  previewFileImage($file, $canvas, $img);
  blur($canvas);
  document.querySelector('.e-wiki-cover-container .canvas-btn-container > .reset-btn').addEventListener(
    'click',
    (e) => {
      // wiki 填表按钮
      const $fillForm = document.querySelector('.e-wiki-fill-form');
      if (base64Data) {
        $img.dispatchEvent(new Event('load'));
      } else if ($file && $file.files[0]) {
        $file.dispatchEvent(new Event('change'));
      } else if ($fillForm) {
        $fillForm.dispatchEvent(new Event('click'));
      }
      e.preventDefault();
    },
    false
  );
  document.querySelector('.e-wiki-cover-container .canvas-btn-container > .clear-btn').addEventListener(
    'click',
    (e) => {
      $canvas.width = 0;
      $canvas.height = 0;
      e.preventDefault();
    }
  )
  const $inputBtn: HTMLInputElement = document.querySelector(
    '.e-wiki-cover-container .inputBtn'
  );
  if ($file) {
    $inputBtn.addEventListener(
      'click',
      async (e) => {
        e.preventDefault();
        if ($canvas.width > 8 && $canvas.height > 10) {
          const $el = e.target as HTMLElement;
          $el.style.display = 'none';
          const $loading = insertLoading($el);
          try {
            const $wikiMode = document.querySelector(
              'table small a:nth-of-type(1)[href="javascript:void(0)"]'
            ) as HTMLElement;
            $wikiMode && $wikiMode.click();
            await sleep(200);
            const url = await sendFormImg(
              $form,
              $canvas.toDataURL('image/png', 1)
            );
            $el.style.display = '';
            $loading.remove();
            location.assign(url);
          } catch (e) {
            console.log('send form err: ', e);
          }
        }
      },
      false
    );
  } else {
    $inputBtn.value = '处理图片';
  }
}

export function insertLoading($sibling: Element): Element {
  const $loading = document.createElement('div');
  $loading.setAttribute(
    'style',
    'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");'
  );
  $sibling.parentElement.insertBefore($loading, $sibling);
  return $loading;
}

/**
 * upload image form on bangumi.tv
 * @param subjectId
 */
export async function uploadImage(subjectId: string) {
  const d = await fetchText(`/${subjectId}/upload_img`, {}, 3000);
  const $canvas: HTMLCanvasElement = document.querySelector(
    '#e-wiki-cover-preview'
  );

  const $doc = new DOMParser().parseFromString(d, 'text/html');
  const $form: HTMLFormElement = $doc.querySelector('form[name=img_upload]');
  if (!$form) return;

  if ($canvas.width > 8 && $canvas.height > 10) {
    const url = await sendFormImg($form, $canvas.toDataURL('image/png', 1));
    location.assign(url);
  }
}
