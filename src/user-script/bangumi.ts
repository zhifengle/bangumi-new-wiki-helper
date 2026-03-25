import { initBangumiPage } from '../page/bangumiPage';
import { userScriptBangumiRuntimeAdapter } from './bangumiRuntimeAdapter';

export const bangumi = {
  init() {
    return initBangumiPage(userScriptBangumiRuntimeAdapter);
  },
};
