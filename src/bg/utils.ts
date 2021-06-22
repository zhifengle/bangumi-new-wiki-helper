import { browser } from 'webextension-polyfill-ts';

export async function setVal(name: string, val: any) {
  const config = (await browser.storage.local.get(['config'])).config;
  await browser.storage.local.set({
    config: {
      ...config,
      [name]: val,
    },
  });
}
