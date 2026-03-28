import browser from 'webextension-polyfill';
import { initPopupApp } from './popupApp';

window.onload = function () {
  void initPopupApp(document, browser);
};
