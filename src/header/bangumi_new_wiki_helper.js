// ==UserScript==
// @name        bangumi new wiki helper
// @name:zh-CN  bangumi 创建条目助手
// @namespace   https://github.com/zhifengle
// @description assist to create new subject
// @description:zh-cn 辅助创建 bangumi.tv 上的条目
// @include     http://www.getchu.com/soft.phtml?id=*
// @include     /^https?:\/\/www\.amazon\.co\.jp\/.*$/
// @include     /^https?:\/\/(bangumi|bgm|chii)\.(tv|in)\/.*$/
// @match      *://*/*
// @author      zhifengle
// @homepage    https://github.com/zhifengle/bangumi-new-wiki-helper
// @version     0.4.28
// @note        0.4.27 支持音乐条目曲目列表
// @note        0.3.0 使用 typescript 重构，浏览器扩展和脚本使用公共代码
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_openInTab
// @grant       GM_registerMenuCommand
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceText
// @resource    NOTYF_CSS https://cdnjs.cloudflare.com/ajax/libs/notyf/3.10.0/notyf.min.css
// @require     https://cdnjs.cloudflare.com/ajax/libs/fuse.js/6.4.0/fuse.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/notyf/3.10.0/notyf.min.js
// ==/UserScript==
