import { SiteConfig } from './interface/wiki'
import { getWikiItem } from './sites/common'
import { SingleInfo } from './interface/subject'
import { steamdbModel } from './models/steamdb'
import { steamModel } from './models/steam'

const getData = async (list: Promise<any>[]) => {
  return await Promise.all(list)
}

const getInfoList = async (siteConfig: SiteConfig) => {
  const rawList = await getData(
    siteConfig.itemList.map((item) => getWikiItem(item, siteConfig.key))
  )
  const infoList: SingleInfo[] = rawList.filter((i) => i)
  console.info('wiki info list: ', infoList)
  return infoList
}

getInfoList(steamModel)
