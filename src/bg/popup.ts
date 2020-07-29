// @ts-ignore
import browser from 'webextension-polyfill';

const selectConfig: any = {
  domain: {
    options: ['bangumi.tv', 'bgm.tv', 'chii.in'],
  },
};
window.onload = async function () {
  const config = (await browser.storage.local.get(['config'])).config;
  for (const key in config) {
    const $t = document.querySelector(
      `input[name=${key}][type="checkbox"]`
    ) as HTMLInputElement;
    if ($t) {
      $t.checked = config[key];
      continue;
    }
    const $select = document.querySelector(
      `select[name=${key}]`
    ) as HTMLSelectElement;
    if ($select) {
      $select.value = selectConfig[key].options.indexOf(config[key]);
      continue;
    }
    const $input = document.querySelector(
      `input[name=${key}]`
    ) as HTMLInputElement;
    if ($input) {
      $input.value = config[key];
    }
  }
  initEvent();
};

function initEvent() {
  document
    .querySelector('.setting-container > ul')
    .addEventListener('click', (e) => {
      const $target = e.target as any;
      if (
        $target.tagName.toLowerCase() === 'input' &&
        $target.type === 'checkbox'
      ) {
        if ($target.name !== 'clearBtn') {
          setVal($target.name, $target.checked);
        } else {
          clearInfo();
        }
      }
    });
  document
    .querySelector('.setting-container > ul')
    .addEventListener('change', (e) => {
      const $target = e.target as any;
      if ($target.tagName.toLowerCase() === 'select') {
        setSelectVal($target.name, $target.value);
      } else if (
        ['number', 'text'].includes($target.type) &&
        $target.tagName.toLowerCase() === 'input'
      ) {
        setVal($target.name, $target.value);
      }
    });
}
function clearInfo() {
  browser.storage.local.set({
    wikiData: null,
  });
  console.info('clear storage success!');
}
function setCheckBox(name: string, val: boolean) {
  // @ts-ignore
  document.querySelector(`input[name=${name}`).checked = val;
}
async function setVal(name: string, val: any) {
  const config = (await browser.storage.local.get(['config'])).config;
  await browser.storage.local.set({
    config: {
      ...config,
      [name]: val,
    },
  });
}
async function setSelectVal(name: string, val: string) {
  if (selectConfig[name]) {
    const config = (await browser.storage.local.get(['config'])).config;
    await browser.storage.local.set({
      config: {
        ...config,
        [name]: selectConfig[name].options[val],
      },
    });
  }
}
