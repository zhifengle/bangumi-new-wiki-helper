import { getchuGameModel } from './getchuGame';
import { amazonSubjectModel } from './amazonJpBook';
import { erogamescapeModel } from './erogamescape';
import { steamdbModel } from './steamdb';
import { steamModel } from './steam';
import { dangdangBookModel } from './dangdangBook';
import { jdBookModel } from './jdBook';
import { doubanGameModel } from './doubanGame';
import { doubanGameEditModel } from './doubanGameEdit';
import { InfoConfig, SiteConfig } from '../interface/wiki';
import { dlsiteGameModel } from './dlsiteGame';
import { dmmGameModel } from './dmmGame';

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
  [doubanGameEditModel.key]: doubanGameEditModel,
  [dlsiteGameModel.key]: dlsiteGameModel,
  [dmmGameModel.key]: dmmGameModel,
};

export function findModelByHost(host: string) {
  const keys = Object.keys(configs);
  const models: SiteConfig[] = [];
  for (let i = 0; i < keys.length; i++) {
    const hosts = configs[keys[i]].host;
    if (hosts.includes(host)) {
      models.push(configs[keys[i]]);
      // return configs[keys[i]];
    }
  }
  return models;
}

export function findInfoConfigByName(
  itemList: InfoConfig[],
  name: string
): InfoConfig {
  for (let i = 0; i < itemList.length; i++) {
    const item = itemList[i];
    if (item.name === name) {
      return item;
    }
  }
}
