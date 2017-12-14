import browser from 'webextension-polyfill';
import models from '../models';

function handleResponse(message) {
  console.log(`Message from the background script:  ${message.response}`);
}

function handleError(error) {
  console.log(`Error: ${error.message}`);
}

/**
 * 获取查找条目需要的信息
 * @param {Object[]} items
 */
function getQueryInfo(items) {
  var info = {};
  items.forEach((item) => {
    if (item.category === 'subject_title') {
      info.subjectName = item.data;
    }
    if (item.category === 'date') {
      info.startDate = item.data;
    }
    if (item.category === 'ISBN') {
      info.isbn = item.data;
    }
  });
  if (info.subjectName) {
    return info;
  }
  return;
}
/**
 * dollar 选择符
 * @param {string} selector 
 */
function $(selector) {
  return document.querySelector(selector);
}
function getCoverURL(coverConfig) {
  if (!coverConfig) return;
  var $cover = $(coverConfig.selector);
  return {
    coverURL: $cover.src,
    height: $cover.height,
    width: $cover.width
  };
}
/**
 * 生成wiki的项目
 * @param {Object} itemConfig 
 * @returns {Object}
 * @TODO
 */
function getWikiItem(itemConfig) {
  var data = getItemData(itemConfig);
  if (data) {
    return {
      name: itemConfig.name,
      data,
      category: itemConfig.category
    };
  }
  return {};
}
/**
 * 生成wiki的项目数据
 * @param {Object} itemConfig 
 * @returns {string}
 */
function getItemData(itemConfig) {
  var $t;
  if (itemConfig.selector && !itemConfig.subSelector) {
    $t = $(itemConfig.selector);
  } else if (itemConfig.keyWord) {  // 使用关键字搜索节点
    $t = getDOMByKeyWord(itemConfig);
  }
  if ($t) {
    return dealRawText($t.innerText, [itemConfig.keyWord], itemConfig);
  }
}
/**
 * 处理无关字符
 * @param {string} str 
 * @param {Object[]} filterArry
 */
function dealRawText(str, filterArray = [], itemConfig) {
  if (itemConfig && itemConfig.category === 'subject_summary') {
    return str;
  }
  if (itemConfig && itemConfig.separator) {
    str = splitText(str, itemConfig);
  }
  const textList = ['\\(.*\\)', '（.*）', ...filterArray];
  return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
}
/**
 * 通过关键字查找DOM
 * @param {Object} itemConfig 
 * @returns {Object[]}
 */
function getDOMByKeyWord(itemConfig) {
  let targets;
  // 有父节点, 基于二级选择器
  if (itemConfig.selector) {
    targets = contains(itemConfig.subSelector, itemConfig.keyWord, $(itemConfig.selector));
  } else {
    targets = contains(itemConfig.subSelector, itemConfig.keyWord);
  }
  var $t = targets[targets.length - 1];
  // 相邻节点
  if (itemConfig.sibling) {
    $t = targets[targets.length - 1].nextElementSibling;
  }
  return $t;
}
function splitText(text, itemConfig) {
  const s = {
    ':': ':|：',
    ',': ',|，'
  };
  var t = text.split(new RegExp(s[itemConfig.separator]));
  return t[t.length - 1].trim();
}
/**
 * 查找包含文本的标签
 * @param {string} selector 
 * @param {string} text 
 */
function contains(selector, text, $parent) {
  var elements;
  if ($parent) {
    elements = $parent.querySelectorAll(selector);
  } else {
    elements = document.querySelectorAll(selector);
  }
  return [].filter.call(elements, function (element) {
    return new RegExp(text).test(element.innerText);
  });
}

function init() {
  var whiteList = ['amazon', 'getchu'];
  if (!window.location.host.match(new RegExp(whiteList.join('|')))) {
    console.info('domain is not in whitelist');
    return;
  }
  browser.storage.local.get()
    .then(obj => {
      let config = models.configModel[obj.currentConfig];
      var subjectInfoList = config.itemList.map(i => getWikiItem(i));
      console.info('fetch info: ', subjectInfoList);
      var queryInfo = getQueryInfo(subjectInfoList);
      var coverInfo = getCoverURL(config.cover);
      if (queryInfo) {
        browser.storage.local.set({
          subjectInfoList: subjectInfoList,
        })
          .then(() => {
            let sending = browser.runtime.sendMessage({
              queryInfo: getQueryInfo(subjectInfoList),
              coverInfo
            });
            sending.then(handleResponse, handleError);
          });
      }
    });
}
init();
