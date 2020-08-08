import { getchuGameModel } from './getchuGame';
import { amazonSubjectModel } from './amazonJpBook';
import { erogamescapeModel } from './erogamescape';
import { steamdbModel } from './steamdb';
import { steamModel } from './steam';
import { dangdangBookModel } from './dangdangBook';
import { jdBookModel } from './jdBook';
import { doubanGameModel } from './doubanGame';

// 新增的 site model 需要在这里配置
export const configs = {
  [getchuGameModel.key]: getchuGameModel,
  [erogamescapeModel.key]: erogamescapeModel,
  [amazonSubjectModel.key]: amazonSubjectModel,
  [steamdbModel.key]: steamdbModel,
  [steamModel.key]: steamModel,
  [dangdangBookModel.key]: dangdangBookModel,
  [jdBookModel.key]: jdBookModel,
  [doubanGameModel.key]: doubanGameModel,
};

export function findModelByHost(host: string) {
  const keys = Object.keys(configs);
  for (let i = 0; i < keys.length; i++) {
    const hosts = configs[keys[i]].host;
    if (hosts.includes(host)) {
      return configs[keys[i]];
    }
  }
}
