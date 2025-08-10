import browser from 'webextension-polyfill';
import { SingleInfo, SubjectWikiInfo } from '../interface/subject';
import { InfoConfig, SiteConfig } from '../interface/wiki';
import { getCharaModel } from '../models';
import { addCharaUI, getCharaData } from '../sites/common';
import { findAllElement, findElement } from '../utils/domUtils';

async function fetchCover(infoList: SingleInfo[]) {
  // 封面有 url 但是获取失败。尝试使用 background 获取
  for (let i = 0; i < infoList.length; i++) {
    const info = infoList[i];
    if (info.category == 'crt_cover') {
      const dataUrl = info?.value?.dataUrl || '';
      const url = info?.value?.url || '';
      if (!/^data:image/.test(dataUrl) && url) {
        console.log('fetch cover by background');
        const dataUrl = await browser.runtime.sendMessage({
          action: 'fetch_data_bg',
          payload: {
            type: 'img',
            url: url,
          },
        });
        if (dataUrl) {
          info.value = {
            url,
            dataUrl,
          };
        }
      }
    }
  }
}
export async function initChara(siteConfig: SiteConfig) {
  // 查找标志性的元素
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const charaModel = getCharaModel(siteConfig.key);
  if (!charaModel) return;
  const $el = findElement(charaModel.controlSelector);
  if (!$el) return;
  // 判断是否在 iframe 里面
  let iframeSel = '';
  let $doc: any;
  if (charaModel.itemSelector instanceof Array) {
    iframeSel = charaModel.itemSelector.find(
      (i) => i.isIframe === true
    )?.selector;
  } else if (charaModel.itemSelector.isIframe) {
    iframeSel = charaModel.itemSelector.selector;
  }
  if (iframeSel) {
    console.log('fetch html by background');
    const url = findElement({
      selector: iframeSel,
    }).getAttribute('src');
    if (url) {
      const rawHtml: string = await browser.runtime.sendMessage({
        action: 'fetch_data_bg',
        payload: {
          type: 'html',
          url,
        },
      });
      $doc = new DOMParser().parseFromString(rawHtml, 'text/html');
    } else {
      return;
    }
  }
  let itemArr = findAllElement(charaModel.itemSelector);
  if ($doc) {
    itemArr = findAllElement(charaModel.itemSelector, $doc);
  }
  // 获取名字列表
  let names = await Promise.all(
    itemArr.map(async ($t) => {
      const nameConfig: InfoConfig = charaModel.itemList.find(
        (item) => item.category == 'crt_name'
      );
      const infos: SingleInfo[] = await getCharaData(
        {
          ...charaModel,
          itemList: [nameConfig],
        },
        $t
      );
      return infos.find((i) => i.category === 'crt_name')?.value;
    })
  );
  // names = names.filter((n) => n);
  addCharaUI($el, names, async (e: Event, val: string) => {
    let targetList: Element[] = [];
    if (val === 'all') {
      // @TODO 一次性新建全部
      // targetList = [...itemArr];
    } else {
      const idx = names.indexOf(val);
      if (idx !== -1) {
        targetList = itemArr.slice(idx, idx + 1);
      }
    }
    for (const $target of targetList) {
      const charaInfo: SingleInfo[] = await getCharaData(charaModel, $target);
      await fetchCover(charaInfo);
      console.info('character info list: ', charaInfo);
      const charaData: SubjectWikiInfo = {
        type: siteConfig.type,
        infos: charaInfo,
      };
      await browser.storage.local.set({
        charaData,
      });
      await browser.runtime.sendMessage({
        action: 'create_new_character',
      });
    }
  });
}
