import { getchuGameModel } from './getchuGame'
import { amazonSubjectModel } from './amazonJpBook'
import { erogamescapeModel } from './erogamescape'
import { steamdbModel } from './steamdb'
import { steamModel } from './steam'
import { InfoConfig, SiteConfig } from '../interface/wiki'

export const configs = {
  [getchuGameModel.key]: getchuGameModel,
  [erogamescapeModel.key]: erogamescapeModel,
  [amazonSubjectModel.key]: amazonSubjectModel,
  [steamdbModel.key]: steamdbModel,
  [steamModel.key]: steamModel,
}

export function findModelByHost(host: string) {
  const keys = Object.keys(configs)
  for (let i = 0; i < keys.length; i++) {
    const hosts = configs[keys[i]].host
    if (hosts.includes(host)) {
      return configs[keys[i]]
    }
  }
}
