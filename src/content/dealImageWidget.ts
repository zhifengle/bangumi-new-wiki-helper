import {getImageDataByURL} from '../utils/dealImage';
import {sendFormImg} from '../utils/ajax';
import {fetchText} from '../utils/fetchData';

interface Pos {
  x: number,
  y: number
}

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent): Pos {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  }
}

/**
 * blur canvas
 * @param el target canvas
 * @param width blur rect width
 * @param radius blur rect height
 */
function blur(el: HTMLCanvasElement, width: number, radius: number) {
  let isDrawing = false
  let ctx = el.getContext('2d')

  el.onmousedown = function (e: MouseEvent) {
    isDrawing = true
    const pos = getMousePos(el, e)
    ctx.moveTo(pos.x, pos.y)
  }
  el.onmousemove = function (e: MouseEvent) {
    if (isDrawing) {
      const pos = getMousePos(el, e)
      // stack blur operation
      // StackBlur.canvasRGBA(el, pos.x - width / 2, pos.y - width / 2, width, width, radius);
    }
  }
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
    <a href="javascript:void(0)" id="e-wiki-cover-reset">reset</a>
    <img src="" alt="" style="display:none;">
  `;
  const $info = document.createElement('div');
  $info.classList.add('e-wiki-cover-container');
  $info.innerHTML = rawHTML;
  $target.parentElement.insertBefore($info, $target.nextElementSibling);
  const $width: HTMLInputElement = document.querySelector('#e-wiki-cover-slider-width');
  const $radius: HTMLInputElement = document.querySelector('#e-wiki-cover-slider-radius');
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

function previewFileImage($file: HTMLInputElement, $canvas: HTMLCanvasElement, $img = new Image()) {
  const ctx = $canvas.getContext('2d')
  $img.addEventListener('load', function () {
    $canvas.width = $img.width;
    $canvas.height = $img.height;
    ctx.drawImage($img, 0, 0);
    window.dispatchEvent(new Event('resize'));  // let img cut tool at right position
  }, false);
  function loadImgData() {
    var file = $file.files[0];
    var reader = new FileReader();
    reader.addEventListener('load', function () {
      $img.src = reader.result as any;
    }, false);
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
export async function dealImageWidget($form: HTMLFormElement, base64Data: string) {
  if (document.querySelector('.e-wiki-cover-container')) return;
  initContainer($form);
  const $canvas: HTMLCanvasElement = document.querySelector('#e-wiki-cover-preview');
  const $img: HTMLImageElement = document.querySelector('.e-wiki-cover-container img');
  if (base64Data) {
    if (base64Data.match(/^http/)) {
      base64Data = await getImageDataByURL(base64Data);
    }
    $img.src = base64Data;
  }
  const $file: HTMLInputElement = $form.querySelector('input[type = file]');
  previewFileImage($file, $canvas, $img);

  const $width: HTMLInputElement = document.querySelector('#e-wiki-cover-slider-width');
  const $radius: HTMLInputElement = document.querySelector('#e-wiki-cover-slider-radius');
  blur($canvas, +$width.value, +$radius.value);
  document.querySelector('#e-wiki-cover-reset').addEventListener('click', (e) => {
    const $fillForm = document.querySelector('.fill-form');
    if (base64Data) {
      $img.dispatchEvent(new Event('load'));
    } else if ($file && $file.files[0]) {
      $file.dispatchEvent(new Event('change'));
    } else if ($fillForm) {
      $fillForm.dispatchEvent(new Event('click'));
    }
  }, false);
  const $inputBtn: HTMLInputElement = document.querySelector('.e-wiki-cover-container .inputBtn');
  if ($file) {
    $inputBtn.addEventListener('click',async (e) => {
      e.preventDefault();
      if ($canvas.width > 8 && $canvas.height > 10) {
        const url = await sendFormImg($form, $canvas.toDataURL('image/jpg', 1));
        // TODO: loading
        // location.assign(url);
      }
    }, false);
  } else {
    $inputBtn.value = '处理图片';
  }
}


/**
 * upload image form on bangumi.tv
 * @param subjectId
 */
export async function uploadImage(subjectId: string) {
  const d = await fetchText(`/${subjectId}/upload_img`, 3000);
  const $canvas: HTMLCanvasElement = document.querySelector('#e-wiki-cover-preview');

  const $doc = (new DOMParser()).parseFromString(d, "text/html");
  const $form: HTMLFormElement = $doc.querySelector('form[name=img_upload]');
  if (!$form) return;

  if ($canvas.width > 8 && $canvas.height > 10) {
    const url = await sendFormImg($form, $canvas.toDataURL('image/jpg', 1));
    // TODO: loading
    // location.assign(url);
  }
}
