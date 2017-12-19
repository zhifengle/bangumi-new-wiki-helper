import browser from 'webextension-polyfill';
import models from '../models';

function handleResponse(message) {
  console.log(`Message from the background script:  ${message}`);
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
    if (item.category === 'ISBN-13') {
      info.isbn13 = item.data;
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
  return $doc.querySelector(selector);
}
function getCoverURL(coverConfig) {
  if (!coverConfig) return;
  var $cover = $(coverConfig.selector);
  if ($cover) {
    return {
      coverURL: $cover.src,
      height: $cover.height,
      width: $cover.width
    };
  }
}
function getSubType(itemConfig) {
  if (!itemConfig) return;
  const dict = {
    'コミック': 0
  };
  var $t;
  if (itemConfig.selector && !itemConfig.subSelector) {
    $t = $(itemConfig.selector);
  } else if (itemConfig.keyWord) {  // 使用关键字搜索节点
    $t = getDOMByKeyWord(itemConfig);
  }
  if ($t) {
    let m = $t.innerText.match(new RegExp(Object.keys(dict).join('|')));
    if (m) return dict[m[0]];
  }
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
  if (targets && targets.length) {
    var $t = targets[targets.length - 1];
    // 相邻节点
    if (itemConfig.sibling) {
      $t = targets[targets.length - 1].nextElementSibling;
    }
    return $t;
  }
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
    elements = $doc.querySelectorAll(selector);
  }
  if (Array.isArray(text)) {
    text = text.join('|');
  }
  return [].filter.call(elements, function (element) {
    return new RegExp(text).test(element.innerText);
  });
}

async function init($doc) {
  if (!$doc) {
    let whiteList = ['amazon', 'getchu'];
    if (!window.location.host.match(new RegExp(whiteList.join('|')))) {
      console.info('domain is not in whitelist');
      return;
    }
    window.$doc = document;
  } else {
    window.$doc = $doc;
  }
  var obj = await browser.storage.local.get();
  let config = models.configModel[obj.currentConfig];
  var subjectInfoList = config.itemList.map(i => getWikiItem(i));
  console.info('fetch info: ', subjectInfoList);
  var queryInfo = getQueryInfo(subjectInfoList);
  var coverInfo = getCoverURL(config.cover);
  var subType = getSubType(config.subType);
  console.log('subType', subType);
  await browser.runtime.sendMessage({
    action: 'fetch_cover_store',
    coverInfo,
    subjectInfo: {
      subjectInfoList, 
      subType
    }
  });
  browser.runtime.sendMessage({
    action: 'search_bangumi',
    queryInfo,
    obj
  });
}
init();

export default init;
