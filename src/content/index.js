import browser from 'webextension-polyfill';

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
  var item = {
    category: itemConfig.category
  };
  if (itemConfig.selector && !itemConfig.subSelector) {
    var $d = $(itemConfig.selector);
    if ($d) {
      item = {
        name: itemConfig.name,
        data: dealRawText($d.innerText, [], itemConfig),
        ...item
      };
    }
  } else if (itemConfig.keyWord) {
    item = {
      ...getItemByKeyWord(itemConfig),
      ...item
    };
  }
  return item;
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
  const textList = [':', '：', '\\(.*\\)', '（.*）', ...filterArray];
  return str.replace(new RegExp(textList.join('|'), 'g'), '').trim();
}
/**
 * 通过关键字提取信息
 * @param {Object} itemConfig 
 * @returns {Object}
 * @TODO
 */
function getItemByKeyWord(itemConfig) {
  // var $t = $(`${itemConfig.tagName}:contains(${itemConfig.keyWord})`)

  var targets;
  if (itemConfig.selector) {
    targets = contains(itemConfig.subSelector, itemConfig.keyWord, $(itemConfig.selector));
  } else {
    targets = contains(itemConfig.subSelector, itemConfig.keyWord);
  }
  if (targets && targets.length) {
    if (itemConfig.sibling) {
      return {
        name: itemConfig.name,
        data: dealRawText(targets[targets.length - 1].nextElementSibling.innerText, [], itemConfig)
      };
    }
    return {
      name: itemConfig.name,
      data: dealRawText(targets[targets.length - 1].innerText, [itemConfig.keyWord], itemConfig)
    };
  } else {
    return {};
  }
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
  browser.storage.local.get()
    .then(obj => {
      let config = obj.configModel[obj.currentConfig];
      var subjectInfoList = config.itemList.map(i => getWikiItem(i));
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
