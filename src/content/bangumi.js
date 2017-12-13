import browser from 'webextension-polyfill';


/**
 * dollar 选择符
 * @param {string} selector 
 */
function $(selector) {
  return document.querySelector(selector);
}

function injectScript(fn, data) {
  var selfInvokeScript = document.createElement("script");
  selfInvokeScript.innerHTML = `(${fn.toString()})(${data});`;
  document.body.appendChild(selfInvokeScript);
}
/**
 * 生成infobox的字符串
 * @param {string} infoType
 * @param {Object[]} infoArray
 */
function genWikiString(infoType, infoArray) {
  let infobox = ["{{Infobox " + infoType];
  for (const info of infoArray) {
    if (Array.isArray(info.data)) {
      let d = data.map((item) => {
        if (item.name) {
          return `[${item.name}|${item.data}]`;
        } else {
          return `[${item}]`;
        }
      }).join('\n');
      infobox.push(`|${info.name}={${d}\n}`);
    } else {
      infobox.push(`|${info.name}=${info.data}`);
    }
  }
  infobox.push('}}');
  console.log('infobox', infobox);
  return infobox.join('\n');
}

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
  var template = document.createElement('template');
  template.innerHTML = html;
  return template.content.firstChild;
}

/**
 * 提交上传图片表单
 * @param {Object} $form - form表单 DOM
 * @param {Object} picBlob - 图片Blob
 */
function sendUploadForm($form, picBlob) {
  var fd = new FormData($form);
  var $file = $form.querySelector('input[type=file]');
  var inputFileName = $file.name ? $file.name : 'picfile';
  fd.set(inputFileName, picBlob, genImageName(picBlob.type));
  var $submit = $form.querySelector('[name=submit]');
  if ($submit && $submit.name && $submit.value) {
    fd.set($submit.name, $submit.value);
  }
  // loading
  $submit.style.display = 'none';
  var $loading = document.createElement('div');
  $loading.style = 'width: 208px; height: 13px; background-image: url("/img/loadingAnimation.gif");';
  $form.appendChild($loading);
  // setTimeout(() => {
  //   $submit.style.display = '';
  //   $loading.remove();
  // }, 1000);
  var xhr = new XMLHttpRequest();
  xhr.open($form.method.toLowerCase(), $form.action, true);
  xhr.onreadystatechange = function () {
    var _location;
    //console.log(xhr);
    if(xhr.readyState === 2 && xhr.status === 200){
      _location = xhr.responseURL;
      $loading.remove();
      $submit.style.display = '';
      if(_location) {
        location.assign(_location);
      }
    }
  };
  xhr.send(fd);
}

function previewImage(coverBlob, parentDOM) {
  var reader = new window.FileReader();
  reader.readAsDataURL(coverBlob);
  reader.onloadend = function() {
    var base64data = reader.result;

    var rawHTML = `<div style="margin-top: 1rem;">
<input style="vertical-align: top;" class="inputBtn" value="上传抓取图片" name="submit" type="button">
<img id="e-wiki-cover-preview" src="${base64data}" alt="">
</div>`;
    var $i = document.querySelector('#e-wiki-cover-preview');
    if ($i) {
      $i.src = base64data;
      $i.parentElement.style.display = '';
    } else {
      parentDOM.appendChild(htmlToElement(rawHTML));
    }
    var clickHandler = function (e) {
      e.target.parentElement.style.display = 'none';
      sendUploadForm(document.querySelector('#columnInSubjectA form'), coverBlob);
      e.target.removeEventListener('click', clickHandler, false);
    };
    document.querySelector('#e-wiki-cover-preview').previousElementSibling.addEventListener('click', clickHandler, false);
  };
}
function genImageName(mimeType) {
  function getImageSuffix(mimeType) {
    var m = mimeType.match(/png|jpg|jpeg|gif|bmp/);
    if (m) {
      switch (m[0]) {
        case 'png':
          return 'png';
        case 'jpg':
        case 'jpeg':
          return 'jpg';
        case 'gif':
          return 'gif';
        case 'bmp':
          return 'bmp';
      }
    }
    return '';
  }
  var genString = Array.apply(null, Array(5)).map(function(){
    return (function(charset){
      return charset.charAt(Math.floor(Math.random()*charset.length));
    }('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'));
  }).join('');
  return `${genString}.${getImageSuffix(mimeType)}`;
}

/**
 * 填写条目信息
 * @param {Object[]} info
 */
function fillSubjectInfo(info) {

  var infoArray = [];
  // var $typeTD = $('table tr:nth-of-type(2) > td:nth-of-type(2)');

  var $wikiMode = $('table small a:nth-of-type(1)[href="javascript:void(0)"]');
  var $newbeeMode = $('table small a:nth-of-type(2)[href="javascript:void(0)"]');
  for (var i = 0, len = info.length; i < len; i++) {
    if (info[i].category === 'subject_title') {
      let $title = $('input[name=subject_title]');
      $title.value = info[i].data;
      continue;
    }
    if (info[i].category === 'subject_summary') {
      let $summary = $('#subject_summary');
      $summary.value = info[i].data;
      continue;
    }
    // 有名称并且category不在制定列表里面
    if (info[i].name && ['cover'].indexOf(info[i].category) === -1) {
      infoArray.push(info[i]);
    }
  }
  $wikiMode.click();
  setTimeout(() => {
    fillInfoBox(infoArray);
    setTimeout(() => {
      $newbeeMode.click();
    }, 500);
  }, 500);
  
}

function fillInfoBox(infoArray) {
  var $infobox = $('#subject_infobox');
  var arr = $infobox.value.split('\n');
  var newArr = [];
  for (var info of infoArray) {
    let isDefault = false;
    for (var i = 0, len = arr.length; i < len; i++) {
      let n = arr[i].replace(/\||=.*/g, '');
      if (n === info.name) {
        arr[i] = arr[i].replace(/=[^{[]+/, '=') + info.data;
        isDefault = true;
        break;
      }
    }
    if (!isDefault && info.name && !info.category) {
      newArr.push(`|${info.name}=${info.data}`);
    }
  }
  arr.pop();
  $infobox.value = [...arr, ...newArr, '}}'].join('\n');
}

function init() {
  var re = new RegExp(['new_subject', 'upload_img'].join('|'));
  var page = document.location.href.match(re);
  if (page) {
    browser.storage.local.get(['subjectInfoList', 'subjectCover'])
      .then((obj) => {
        switch (page[0]) {
          case 'new_subject':
            if (obj.subjectInfoList) {
              fillSubjectInfo(obj.subjectInfoList);
            } else {
              alert('条目信息为空');
            }
            break;
          case 'upload_img':
            if (obj.subjectCover) {
              previewImage(obj.subjectCover, document.querySelector('#columnInSubjectA'));
              // console.log(genImageName(obj.subjectCover.type));
            }
            break;
        }
      })
      .catch((err) => {
        console.log('get subjectInfo err: ', err);
      });
  }
}
init();
