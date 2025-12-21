declare var Fuse: any;

declare var GM_setValue: any;
declare var GM_getValue: any;
declare var GM_registerMenuCommand: any;
declare var GM_addStyle: any;
declare var GM_openInTab: any;
declare var GM_getResourceText: any;
declare var GM_deleteValue: any;

// @TODO avoid use global variable
interface Window {
  // 后台的 url
  _fetch_url_bg?: string;
}
