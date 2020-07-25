import { SiteConfig } from './interface/wiki'
import { getWikiItem, getWikiData } from './sites/common'
import { SingleInfo } from './interface/subject'
import { steamdbModel } from './models/steamdb'
import { steamModel } from './models/steam'

// links
// https://store.steampowered.com/app/1044620/_/?l=schinese&curator_clanid=30614503
// https://steamdb.info/app/1044620/info/
// https://steamdb.info/app/1121560/info/

// https://www.amazon.co.jp/dp/4757556977

const getData = async (list: Promise<any>[]) => {
  return await Promise.all(list)
}

const getInfoList = async (siteConfig: SiteConfig) => {
  const infoList = await getWikiData(siteConfig)
  console.info('wiki info list: ', infoList)
  return infoList
}

getInfoList(steamdbModel)
getInfoList(steamModel)
