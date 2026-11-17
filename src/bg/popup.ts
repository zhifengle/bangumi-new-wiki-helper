import browser from 'webextension-polyfill';
import { UI_FONT_STACK } from '../css/fontStacks';
import { initPopupApp } from './popupApp';

document.documentElement.style.setProperty('--bnwh-font-ui', UI_FONT_STACK);

window.onload = function () {
  void initPopupApp(document, browser);
};
