import browser from 'webextension-polyfill';
import {
  BrowserConfig,
  BrowserStorageState,
  normalizeBrowserConfig,
} from '../runtime/browserConfig';

export async function loadBrowserConfig(
  browserApi: typeof browser = browser
): Promise<BrowserConfig> {
  const state = (await browserApi.storage.local.get([
    'config',
  ])) as BrowserStorageState;
  return normalizeBrowserConfig(state.config);
}

export async function setConfigValue<K extends keyof BrowserConfig>(
  name: K,
  value: BrowserConfig[K],
  browserApi: typeof browser = browser
) {
  const config = await loadBrowserConfig(browserApi);
  await browserApi.storage.local.set({
    config: {
      ...config,
      [name]: value,
    },
  });
}

export async function clearCachedWikiData(
  browserApi: typeof browser = browser
) {
  await browserApi.storage.local.set({
    wikiData: null,
  });
}
