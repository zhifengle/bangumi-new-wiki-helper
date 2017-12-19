import browser from 'webextension-polyfill';
import dealImageWidget from './upload_img';
import '../css/bangumi.less'
import { gmFetchBinary, gmFetch } from '../bg/utils/gmFetch';


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

function sleep(t) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(t);
    }, t);
  });
}

/**
 * 填写条目信息
 * @param {Object[]} info
 */
async function fillSubjectInfo(info, subType) {

  var infoArray = [];
  var $typeInput = document.querySelectorAll('table tr:nth-of-type(2) > td:nth-of-type(2) input');
  if ($typeInput) {
    $typeInput[0].click();
    if (!isNaN(subType)) {
      $typeInput[subType].click();
    }
  }
  await sleep(100);

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
  setTimeout(async () => {
    fillInfoBox(infoArray);
    await sleep(300);
    $newbeeMode.click();
  }, 100);
  
}

function dealDate(dataStr) {
  let l = dataStr.split('/');
  return l.map((i) => {
    if (i.length === 1){
      return `0${i}`;
    }
    return i;
  }).join('-');
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
        let d = info.data;
        if (info.category === 'date') {
          d = dealDate(d);
        }
        arr[i] = arr[i].replace(/=[^{[]+/, '=') + d;
        isDefault = true;
        break;
      }
    }
    if (!isDefault && info.name) {
      newArr.push(`|${info.name}=${info.data}`);
    }
  }
  arr.pop();
  $infobox.value = [...arr, ...newArr, '}}'].join('\n');
}
/**
 * 创建搜索页面的条目项目
 * @param {Objet} item
 */
function creatItem(item, key) {
  var rawHTML = `
<li class="item odd clearit">
<a href="${item.href}" target="_blank" class="subjectCover cover ll">
<span class="image">
<img src="${item.base64Data}" class="cover e-wiki-search-cover">
</span>
<span class="overlay"></span>
</a>
<div class="inner">

<div id="collectBlock_217414" class="collectBlock tip_i">
<ul class="collectMenu">
<li>
<a href="javascript:void(0)" key="${key}" title="text" class="collect_btn chiiBtn thickbox e-wiki-add-btn"><span>添加条目</span></a>
</li>
</ul>
</div>
<h3>
<span class="ico_subject_type subject_type_1 ll"></span>
<a href="${item.href}" target="_blank" class="l">${item.title}</a> <small class="grey"></small>
</h3>
<p class="info tip">
${item.info}
</p>
</div>
</li>
  `
  return rawHTML;
}

function insertItemList(infoArray) {
  var $ul = $('#browserItemList');
  var raw = '';
  infoArray.forEach((item, i) => {
    raw += creatItem(item, i);
  });
  $ul.innerHTML = raw;
  $ul.addEventListener('click', (e) => {
    console.log(e.target);
    if (e.target.classList.contains('e-wiki-add-btn')) {
      let key = e.target.getAttribute('key');
      let sending = browser.runtime.sendMessage({
        action: 'fetch_amazon',
        url: infoArray[key].href
      });
    }
  }, false);
}

/**
 * 获取搜索字符串
 *
 */
function getSearchString() {
  let val1 = $('#search_text').value;
  let val2 = $('.searchInputL').value;
  if (val2) return val2;
  if (val1) return val1;
}

function handleResponse(message) {
  if (message && message.action === 'search_amazon') {
    console.log('infoArray: ', message.infoArray);
    insertItemList(message.infoArray);
  }
}

function handleError(error) {
  console.log(`Error: ${error.message}`);
}

function init() {
  var re = new RegExp(['new_subject', 'upload_img', 'subject_search'].join('|'));
  var page = document.location.href.match(re);
  if (page) {
    browser.storage.local.get()
      .then((obj) => {
        switch (page[0]) {
          case 'new_subject':
            if (obj.subjectInfo && obj.subjectInfo.subjectInfoList) {
              fillSubjectInfo(obj.subjectInfo.subjectInfoList, obj.subjectInfo.subType);
            } else {
              alert('条目信息为空');
            }
            break;
          case 'upload_img':
            dealImageWidget($('form[name=img_upload]'), obj.subjectInfo.subjectCover);
            break;
          case 'subject_search':
            let s = getSearchString();
            if (s) {
              var $ul = $('#browserItemList');
              $('#multipage').innerHTML = '';
              $ul.innerHTML = `
              <div class="e-wiki-cover-blur-loading"></div>
              `;
              let sending = browser.runtime.sendMessage({
                action: 'search_amazon',
                searchSubject: s
              });
              sending.then(handleResponse, handleError);
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
