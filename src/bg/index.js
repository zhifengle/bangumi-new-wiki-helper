import browser from 'webextension-polyfill';
import models from '../models';
import { fetchBangumiDataBySearch } from './utils/searchBangumiSubject';
import { gmFetchBinary, gmFetch } from './utils/gmFetch';

const VERSION = require('../../extension/manifest.json').version;
// browser.storage.local.clear()
// 初始化设置
browser.storage.local.get().then(obj => {
  if (obj && !obj.version || obj.version !== VERSION) {
    browser.storage.local.set({
      currentConfig: 'amazon_jp_book',
      searchSubject: true,
      newSubjectType: 1,
      bangumiDomain: 'bgm.tv',
      activeOpen: true,
      version: VERSION
    });
  }
});

function createTab (url, active) {
  return new Promise(resolve => {
    chrome.tabs.create({url, active}, async tab => {
      chrome.tabs.onUpdated.addListener(function listener (tabId, info) {
        if (info.status === 'complete' && tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve(tab);
        }
      });
    });
  });
}

async function checkSubjectExist(queryInfo, newSubjectType) {
  let searchResult = await fetchBangumiDataBySearch(queryInfo, newSubjectType);
  console.info('First: search result of bangumi: ', searchResult);
  if (searchResult && searchResult.subjectURL) {
    return searchResult;
  } 
  if (queryInfo.isbn) {
    queryInfo.isbn = undefined;
    searchResult = await fetchBangumiDataBySearch(queryInfo, newSubjectType);
    console.info('Second: search result of bangumi: ', searchResult);
    return searchResult;
  }
}
async function createNewSubjectTab(newSubjectType, bangumiDomain, activeOpen) {
  var url =  `https://bgm.tv/new_subject/${newSubjectType}`;
  url = changeDomain(url, bangumiDomain);
  // 检查标签是否存在
  let tabs = await browser.tabs.query({
    url: '*://*/new_subject/*',
    title: '添加新条目'
  });
  if (tabs && tabs.length) {
    let tabId = tabs[0].id;
    browser.tabs.executeScript(tabId, {
      file: '/dist/bangumi.js'
    });
  } else {
    let tab = await createTab(url, activeOpen);
    browser.tabs.executeScript(tab.id, {
      file: '/dist/bangumi.js'
    });
  }
}

async function handleMessage(request) {
  var obj = await browser.storage.local.get();
  var newSubjectType = obj.newSubjectType;
  var coverInfo = request.coverInfo;

  if (coverInfo && coverInfo.coverURL) {
    let myBlob = await gmFetchBinary(coverInfo.coverURL);
    console.info('cover pic: ', myBlob);
    if (myBlob) {
      var reader = new window.FileReader();
      reader.readAsDataURL(myBlob);
      reader.onloadend = function() {
        var base64Data = reader.result;
        browser.storage.local.set({
          subjectCover: base64Data
        });
      };
    }
  }
  try {
    if (obj.searchSubject) {
      var result = await checkSubjectExist(request.queryInfo, newSubjectType);
      if (result && result.subjectURL) {
        browser.tabs.create({
          url: changeDomain(result.subjectURL, obj.bangumiDomain),
          active: obj.activeOpen
        });
      } else {
        createNewSubjectTab(obj.newSubjectType, obj.bangumiDomain, obj.activeOpen);
      } 
    } else {
      createNewSubjectTab(obj.newSubjectType, obj.bangumiDomain, obj.activeOpen);
    }
  } catch (e) {
    /* handle error */
    console.log('err:', e, e.message);
  }
}

// 使用browser时，会报错
browser.runtime.onMessage.addListener(handleMessage);

browser.contextMenus.create({
  id: "bangumi-new-wiki",
  // shortcut: 'N',
  title: 'New subject(Bangumi)',
  contexts: ["page"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "bangumi-new-wiki":
      browser.tabs.query({ 'active': true, 'lastFocusedWindow': true })
        .then(tabs => tabs[0].url)
        .then(url => {
          var file = '/dist/content.js';
          if (url.match(/bgm\.tv|bangumi\.tv|chii\.in/)) {
            file = '/dist/bangumi.js';
            browser.tabs.insertCSS({
              file: '/dist/bangumi.css'
            });
          }
          return browser.tabs.executeScript({
            file: file
          });
        });
      break;
  }
});

// 变更url的域名
function changeDomain(url, domain) {
  if (url.match(domain)) return url;
  if (domain === 'bangumi.tv') {
    return url.replace('https', 'http').replace('bgm.tv', domain);
  }
}
