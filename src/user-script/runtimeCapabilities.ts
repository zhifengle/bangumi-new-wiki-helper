import { RuntimeCapabilities } from '../runtime/capabilities';
import { fetchText } from '../utils/fetchData';
import { logMessage } from '../utils/log';
import { userScriptDraftStore } from './draftStore';

export const userScriptRuntimeCapabilities: RuntimeCapabilities = {
  transport: {
    fetchHtml(url: string) {
      return fetchText(url);
    },
  },
  storage: userScriptDraftStore,
  navigator: {
    async openTab(url: string) {
      GM_openInTab(url);
    },
  },
  notifier: {
    notify(message) {
      return logMessage(message);
    },
  },
};
