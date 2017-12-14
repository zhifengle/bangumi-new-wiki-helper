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
      searchSubject: false,
      newSubjectType: 1,
      bangumiDomain: 'bgm.tv',
      version: VERSION
    });
  }
});

function handleMessage(request, sender, sendResponse) {

  browser.storage.local.get()
    .then(obj => {
      var newSubjectType = obj.newSubjectType;
      var coverInfo = request.coverInfo;
      if (coverInfo && coverInfo.coverURL) {
        gmFetchBinary(coverInfo.coverURL).then(function(myBlob) {
          console.info('cover pic: ', myBlob);
          browser.storage.local.set({
            subjectCover: myBlob
          });
        });
      }
      if (obj.searchSubject) {
        fetchBangumiDataBySearch(request.queryInfo, newSubjectType).then((d) => {
          console.info('search result of bangumi: ', d);
          browser.tabs.create({
            url: changeDomain(d.subjectURL, obj.bangumiDomain)
          });
        });
      } else {
        var url =  `https://bgm.tv/new_subject/${newSubjectType}`;
        url = changeDomain(url, obj.bangumiDomain);
        browser.tabs.query({
          url: '*://*/new_subject/*',
          title: '添加新条目'
        }).then((tabs) => {
          if (tabs && tabs.length) {
            let tabId = tabs[0].id;
            browser.tabs.executeScript(tabId, {
              file: '/dist/bangumi.js'
            });
          } else {
            browser.tabs.create({
              url: changeDomain(url, obj.bangumiDomain)
            }).then((tab) => {
              if (tab.status === 'complete') {
                browser.tabs.executeScript(tab.id, {
                  file: '/dist/bangumi.js'
                });
              }
            });
          }
        })
      }
    })
    .catch((r) => {
      console.log('err:', r, r.message);
    });
  var response = {
    response: "Response from background script"
  };
  sendResponse(response);
}


// 使用browser时，会报错
chrome.runtime.onMessage.addListener(handleMessage);

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
