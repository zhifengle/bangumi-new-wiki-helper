import browser from 'webextension-polyfill';
import {
  BrowserConfig,
  BrowserStorageState,
  DEFAULT_BROWSER_CONFIG,
  normalizeBrowserConfig,
} from '../runtime/browserConfig';

export type ConfigControllerOptions = {
  browserApi?: typeof browser;
  appVersion?: string;
};

export function createConfigController(options: ConfigControllerOptions = {}) {
  const browserApi = options.browserApi ?? browser;
  const appVersion = options.appVersion ?? '';

  let userConfig: BrowserConfig = DEFAULT_BROWSER_CONFIG;

  function setConfig(config?: Partial<BrowserConfig> | null) {
    userConfig = normalizeBrowserConfig(config);
  }

  function getConfig() {
    return userConfig;
  }

  async function initConfig(
    onConfigChange: (config: BrowserConfig) => void
  ): Promise<void> {
    const state = (await browserApi.storage.local.get([
      'version',
      'config',
    ])) as BrowserStorageState;

    if (!state.version || state.version !== appVersion) {
      await browserApi.storage.local.set({
        version: appVersion,
        config: DEFAULT_BROWSER_CONFIG,
      });
      userConfig = DEFAULT_BROWSER_CONFIG;
    } else {
      setConfig(state.config);
    }

    browserApi.storage.onChanged.addListener(
      async (changes: Record<string, { newValue?: unknown }>) => {
        if (changes.config) {
          const nextState = (await browserApi.storage.local.get([
            'config',
          ])) as BrowserStorageState;
          setConfig(nextState.config);
          onConfigChange(userConfig);
        }
      }
    );
  }

  return { setConfig, getConfig, initConfig };
}
