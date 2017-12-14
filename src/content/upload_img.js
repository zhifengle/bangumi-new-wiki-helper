import StackBlur from "stackblur-canvas";

function insertBlurInfo($target) {
  const rawHTML = `
    <input style="vertical-align: top;" class="inputBtn" value="上传抓取图片" name="submit" type="button">
    <canvas id="e-wiki-cover-preview" width="8" height="10"></canvas>
    <br>
    <label for="e-wiki-cover-amount">Blur width and radius:</label>
    <input id="e-wiki-cover-amount" type="text" readonly>
    <br>
    <input id="e-wiki-cover-slider-width" type="range" value="20" name="width" min="1" max="100"><canvas></canvas>
    <br>
    <input id="e-wiki-cover-slider-radius" type="range" value="10" name="radius" min="1" max="100">
    <br>
    <a href="#" class="e-wiki-cover-reset">reset</a>
    <img src="" alt="">
  `;
  var $info = document.createElement('div');
  $info.classList.add('e-wiki-cover-container');
  $info.innerHTML = rawHTML;
  $target.parentElement.insertBefore($info, $target.nextElementSibling);
  drawRec(document.querySelector('#e-wiki-cover-slider-width'));
}

function drawRec($width) {
  var $canvas = $width.nextElementSibling;
  var ctx = $canvas.getContext('2d');
  var width = Number($width.value);
  $canvas.width = width * 1.4;
  $canvas.height = width * 1.4;
  ctx.strokeStyle = '#f09199';
  ctx.strokeRect(0.2 * width, 0.2 * width, width, width);
  window.dispatchEvent(new Event('resize'));
}

function previewSelectedImage($file, $canvas, $img) {
  var ctx = $canvas.getContext('2d');
  var $img = new Image();
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
      $img.src = reader.result;
    }, false);
    if (file) {
      reader.readAsDataURL(file);
    }
  }
  $file.addEventListener('change', loadImgData, false);
}

function blur(el, w, r) {
  var isDrawing;
  var ctx = el.getContext('2d');
  el.onmousedown = function (e) {
    isDrawing = true;
    var pos = getMousePos(el, e);
    ctx.moveTo(pos.x, pos.y);
  };
  el.onmousemove = function (e) {
    if (isDrawing) {
      //ctx.lineTo(e.layerX, e.layerY);
      //ctx.stroke();
      var width = w;
      var radius = r;
      var pos = getMousePos(el, e);
      StackBlur.canvasRGBA(el, pos.x - width / 2, pos.y - width / 2, width, width, radius);
    }
  };
  el.onmouseup = function () {
    isDrawing = false;
  };
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
    y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}

function changeInfo($width, $radius) {
  var $info = document.querySelector('#amount');
  var radius = $radius.value;
  var width = $width.value;
  $info.value = width + ', ' + radius;
}


function dealImageWidget($form, base64Data) {
  insertBlurInfo($form);
  var $canvas = document.querySelector('#e-wiki-cover-preview');
  var $img = document.querySelector('#e-wiki-cover-container img');
  var $file = $form.querySelector('input[type = file]');
  var $width = document.querySelector('#e-wiki-cover-slider-width');
  var $radius = document.querySelector('#e-wiki-cover-slider-radius');
  previewSelectedImage($file, $canvas);
  blur($canvas, $width.value, $radius.value);
  document.querySelector('#e-wiki-cover-reset').addEventListener('click', (e) => {
    e.preventDefault()
    var file = $file.files[0];
    var $fillForm = document.querySelector('.fill-form');
    if (file) {
      $file.dispatchEvent(new Event('change'));
    } else if ($fillForm) {
      $fillForm.dispatchEvent(new Event('click'));
    }
  })
}

export default dealImageWidget;
