import browser from 'webextension-polyfill';
import { RuntimeCapabilities, RuntimeNotifyPayload } from '../runtime/capabilities';
import { browserDraftStore } from '../runtime/browserDraftStore';
import { getImageDataByURL } from '../utils/dealImage';
import { fetchText } from '../utils/fetchData';

type BackgroundRuntimeOptions = {
  active: boolean;
  notify: (payload: RuntimeNotifyPayload) => Promise<void>;
};

export function createBackgroundRuntimeCapabilities(
  options: BackgroundRuntimeOptions
): RuntimeCapabilities {
  return {
    transport: {
      fetchHtml(url: string) {
        return fetchText(url);
      },
      fetchImage(url: string, headers?: Record<string, string>) {
        return getImageDataByURL(url, {
          headers,
        });
      },
    },
    storage: browserDraftStore,
    notifier: {
      notify: options.notify,
    },
    navigator: {
      async openTab(url: string) {
        await browser.tabs.create({
          url,
          active: options.active,
        });
      },
    },
  };
}
