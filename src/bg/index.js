import browser from 'webextension-polyfill';
import models from '../models';
import { fetchBangumiDataBySearch } from './utils/searchBangumiSubject';
import { gmFetchBinary } from './utils/gmFetch';

// browser.storage.local.clear()
// 初始化设置
browser.storage.local.get().then(obj => {
  if (obj && !obj.currentConfig) {
    browser.storage.local.set(models);
    browser.storage.local.set({
      currentConfig: 'amazon_jp_book',
      searchSubject: true,
      newSubjectType: 1,
      bangumiDomain: 'bgm.tv'
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
          browser.storage.local.set({
            subjectCover: myBlob
          });
        });
      }
      if (obj.searchSubject) {
        fetchBangumiDataBySearch(request.queryInfo, newSubjectType).then((d) => {
          console.log('ddddddd', d);
          browser.tabs.create({
            url: changeDomain(d.subjectURL, obj.bangumiDomain)
          });
        });
      } else {
        var url =  `https://bgm.tv/new_subject/${newSubjectType}`;
        browser.tabs.create({
          url: changeDomain(url, obj.bangumiDomain)
        });
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
