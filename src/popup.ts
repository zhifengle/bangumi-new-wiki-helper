// @ts-ignore
import browser from 'webextension-polyfill';

const selectConfig: any = {
  domain: {
    options: ['bangumi.tv', 'bgm.tv', 'chii.in']
  }
}
window.onload = async function() {
  const config = (await browser.storage.local.get(['config'])).config;
  for (const key in config) {
    const $t = document.querySelector(`input[name=${key}]`) as HTMLInputElement;
    if ($t) {
      $t.checked = config[key]
    }
    const $select = document.querySelector(`select[name=${key}]`) as HTMLSelectElement;
    if ($select) {
      $select.value = selectConfig[key].options.indexOf(config[key])
    }
  }
  initEvent();
}

function initEvent() {
  document.querySelector('.setting-container > ul')
    .addEventListener('click', (e) => {
      // @ts-ignore
      if (e.target.tagName.toLowerCase() === 'input') {
        const $target = e.target as HTMLInputElement
        if ($target.name !== 'clearBtn') {
          setVal($target.name, $target.checked)
        } else {
          clearInfo()
        }
      }
    })
  document.querySelector('.setting-container > ul')
    .addEventListener('change', (e) => {
      // @ts-ignore
      if (e.target.tagName.toLowerCase() === 'select') {
        const $target = e.target as HTMLSelectElement
        setSelectVal($target.name, $target.value)
      }
    })
}
function clearInfo() {
  browser.storage.local.set({
    wikiData: null
  });
  console.info('clear storage success!');
}
function setCheckBox(name: string, val: boolean) {
  // @ts-ignore
  document.querySelector(`input[name=${name}`).checked = val
}
async function setVal(name: string, val: boolean) {
  const config = (await browser.storage.local.get(['config'])).config;
  await browser.storage.local.set({
    config: {
      ...config,
      [name]: val
    }
  });
}
async function setSelectVal(name: string, val: string) {
  if (selectConfig[name]) {
    const config = (await browser.storage.local.get(['config'])).config;
    await browser.storage.local.set({
      config: {
        ...config,
        [name]: selectConfig[name].options[val]
      }
    });
  }
}

