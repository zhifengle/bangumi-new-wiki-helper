// ==UserScript==
// @name        bangumi new wiki helper
// @name:zh-CN  bangumi 创建条目助手
// @namespace   https://github.com/22earth
// @description assist to create new subject
// @description:zh-cn 辅助创建 bangumi.tv 上的条目
// @include     http://www.getchu.com/soft.phtml?id=*
// @include     /^https?:\/\/www\.amazon\.co\.jp\/.*$/
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/.*$/
// @match      *://*/*
// @author      22earth
// @homepage    https://github.com/22earth/bangumi-new-wiki-helper
// @version     0.3.6.3
// @note        0.3.0 使用 typescript 重构，浏览器扩展和脚本使用公共代码
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://cdn.staticfile.org/fuse.js/6.4.0/fuse.min.js
// ==/UserScript==

// @TODO 更新版本时 不需要修改 header manifest package 的版本
var __enable_header = ''; // 避免 header 被清除的 hack
console.info(__enable_header);
