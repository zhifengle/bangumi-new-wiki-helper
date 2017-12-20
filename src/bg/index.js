import browser from 'webextension-polyfill';
import { fetchBangumiDataBySearch } from './utils/searchBangumiSubject';
import { getImageDataByURL } from './utils/getImageBase64';
import searchAmazonSubject from './utils/searchAmazonSubject';
import { gmFetch } from './utils/gmFetch';

const VERSION = require('../../extension/manifest.json').version;

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
  var tabId = '';
  if (tabs && tabs.length) {
    tabId = tabs[0].id;
  } else {
    let tab = await createTab(url, activeOpen);
    tabId = tab.id;
  }
  browser.tabs.executeScript(tabId, {
    file: '/dist/bangumi.js'
  });
  browser.tabs.insertCSS(tabId, {
    file: '/dist/bangumi.css'
  });
}

async function handleMessage(request) {
  switch (request.action) {
    case 'fetch_cover_store':
      let { coverInfo, subjectInfo } = request;
      try {
        if (coverInfo && coverInfo.coverURL) {
          let base64Data = await getImageDataByURL(coverInfo.coverURL);
          subjectInfo = { ...subjectInfo, subjectCover: base64Data };
        }
        browser.storage.local.set({
          subjectInfo
        });
      } catch (e) {
        console.log('fetch cover err:', e, e.message);
      }
      break;
    case 'search_bangumi':
      var { obj, queryInfo } = request;
      var newSubjectType = obj.newSubjectType;

      try {
        if (obj.searchSubject) {
          var result = await checkSubjectExist(queryInfo, newSubjectType);
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
        console.log('fetch info err:', e, e.message);
      }
      break;
    case 'search_amazon':
      let r = await searchAmazonSubject(request.searchSubject);
      let infoArray = await Promise.all(r);
      return Promise.resolve({action: request.action, infoArray});
      break;
    case 'fetch_amazon':
      console.log(request.url);
      return Promise.resolve({action: request.action});
      break;
  }
}



// 变更url的域名
function changeDomain(url, domain) {
  if (url.match(domain)) return url;
  if (domain === 'bangumi.tv') {
    return url.replace('https', 'http').replace('bgm.tv', domain);
  }
}

function onError(error) {
  console.error(`Error: ${error}`);
}

function sendMessageToTab(tabId, info) {
  browser.tabs.sendMessage(
    tabId,
    info
  ).then(response => {
    console.log("Response from content script:");
    console.log(response.response);
  }).catch(onError);
}

// 初始化设置
browser.storage.local.get().then(obj => {
  if (obj && !obj.version || obj.version !== VERSION) {
    // browser.storage.local.clear();
    browser.storage.local.set({
      currentConfig: 'amazon_jp_book',
      searchSubject: false,
      newSubjectType: 1,
      bangumiDomain: 'bgm.tv',
      activeOpen: true,
      version: VERSION
    });
  }
});

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
        .then(async tabs => {
          let url = tabs[0].url;
          let tabId = tabs[0].id;
          var file = '/dist/content.js';
          if (url.match(/bgm\.tv|bangumi\.tv|chii\.in/)) {
            file = '/dist/bangumi.js';
            browser.tabs.insertCSS({
              file: '/dist/bangumi.css'
            });
          }
          await browser.tabs.executeScript({
            file: file
          });
        });
      break;
  }
});
