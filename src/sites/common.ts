// Compatibility wrapper only: core logic should live in src/sites/core/*
export { combineInfoList } from './core/merge';
export { filterResults, getQueryInfo } from './core/search';
export { dealItemText, getCharaData, getWikiData, getWikiItem } from './core/extract';
export { getWikiDataByURL } from './core/remote';
export { addCharaUI, insertControlBtn, insertControlBtnChara } from './core/controls';

