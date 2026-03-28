import browser from 'webextension-polyfill';
import {
  BANGUMI_DOMAIN_OPTIONS,
  BrowserConfig,
} from '../runtime/browserConfig';
import { clearCachedWikiData, loadBrowserConfig, setConfigValue } from './utils';

type PopupSelectConfig = {
  domain: {
    options: typeof BANGUMI_DOMAIN_OPTIONS;
  };
};

type BooleanConfigKey = 'activeOpen' | 'useHttps' | 'autoFill';

const popupSelectConfig: PopupSelectConfig = {
  domain: {
    options: BANGUMI_DOMAIN_OPTIONS,
  },
};

function isBooleanConfigKey(key: string): key is BooleanConfigKey {
  return ['activeOpen', 'useHttps', 'autoFill'].includes(key);
}

function getSettingsList(documentObj: Document) {
  const settingsList = documentObj.querySelector('.setting-container > ul');
  if (!(settingsList instanceof HTMLUListElement)) {
    throw new Error('popup settings list is missing');
  }
  return settingsList;
}

function getEventTarget(event: Event) {
  return event.target instanceof HTMLElement ? event.target : null;
}

export function renderPopupConfig(
  documentObj: Document,
  config: BrowserConfig
) {
  (Object.keys(config) as Array<keyof BrowserConfig>).forEach((key) => {
    const checkbox = documentObj.querySelector<HTMLInputElement>(
      `input[name=${String(key)}][type="checkbox"]`
    );
    if (checkbox) {
      checkbox.checked = Boolean(config[key]);
      return;
    }

    const select = documentObj.querySelector<HTMLSelectElement>(
      `select[name=${String(key)}]`
    );
    if (select && key === 'domain') {
      const options = popupSelectConfig.domain.options;
      const selectedIndex = options.indexOf(config.domain);
      if (selectedIndex !== -1) {
        select.value = String(selectedIndex);
      }
      return;
    }

    const input = documentObj.querySelector<HTMLInputElement>(
      `input[name=${String(key)}]`
    );
    if (input) {
      input.value = String(config[key]);
    }
  });
}

export function bindPopupEvents(
  documentObj: Document,
  browserApi: typeof browser = browser
) {
  const settingsList = getSettingsList(documentObj);

  settingsList.addEventListener('click', (event) => {
    const target = getEventTarget(event);
    if (!(target instanceof HTMLInputElement)) return;
    if (target.name === 'clearBtn') {
      void clearCachedWikiData(browserApi);
      return;
    }
    if (target.type === 'checkbox' && isBooleanConfigKey(target.name)) {
      void setConfigValue(target.name, target.checked, browserApi);
    }
  });

  settingsList.addEventListener('change', (event) => {
    const target = getEventTarget(event);
    if (!target) return;

    if (target instanceof HTMLSelectElement && target.name === 'domain') {
      const nextDomain = popupSelectConfig.domain.options[Number(target.value)];
      if (nextDomain) {
        void setConfigValue('domain', nextDomain, browserApi);
      }
      return;
    }

    if (
      target instanceof HTMLInputElement &&
      ['number', 'text'].includes(target.type) &&
      target.name === 'subjectId'
    ) {
      void setConfigValue('subjectId', target.value, browserApi);
    }
  });
}

export async function initPopupApp(
  documentObj: Document = document,
  browserApi: typeof browser = browser
) {
  const config = await loadBrowserConfig(browserApi);
  renderPopupConfig(documentObj, config);
  bindPopupEvents(documentObj, browserApi);
}
