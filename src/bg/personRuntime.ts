import { RuntimeNotifyPayload } from '../runtime/capabilities';
import { BrowserConfig, buildBangumiHost } from '../runtime/browserConfig';
import { PersonCreationRuntime } from '../runtime/personCreation';

export type PersonRuntimeDeps = {
  getConfig: () => BrowserConfig;
  notify: (payload: RuntimeNotifyPayload) => void | Promise<void>;
  openTab: (url: string) => Promise<void>;
};

export function buildPersonCreationRuntime(
  deps: PersonRuntimeDeps
): PersonCreationRuntime {
  const { getConfig, notify, openTab } = deps;
  const host = buildBangumiHost(getConfig());
  return {
    bangumi: {
      host,
    },
    notify,
    async openExistingPerson(url: string) {
      await openTab(host + url);
    },
    async openNewPerson() {
      await openTab(`${host}/person/new`);
    },
  };
}
