import { SiteConfig, SubjectTypeId } from '../interface/wiki'

export const steamModel: SiteConfig = {
  key: 'steam_game',
  description: 'steam',
  host: ['store.steampowered.com'],
  type: SubjectTypeId.game,
  pageSelectors: [
    {
      selector: '.apphub_AppName',
    },
  ],
  controlSelector: {
    selector: '.apphub_AppName',
  },
  itemList: [],
}

steamModel.itemList.push(
  {
    name: '游戏名',
    selector: {
      selector: '.apphub_AppName',
    },
    category: 'subject_title',
  },
  {
    name: '发行日期',
    selector: {
      selector: '.release_date .date',
    },
    category: 'date',
  },
  {
    name: '开发',
    selector: {
      selector: '.glance_ctn_responsive_left .user_reviews',
      subSelector: '.dev_row .subtitle',
      keyWord: ['开发商', 'DEVELOPER'],
      sibling: true,
    },
  },
  {
    name: '发行',
    selector: {
      selector: '.glance_ctn_responsive_left .user_reviews',
      subSelector: '.dev_row .subtitle',
      keyWord: ['发行商', 'PUBLISHER'],
      sibling: true,
    },
  },
  {
    name: 'website',
    selector: {
      selector: '.responsive_apppage_details_left.game_details',
      subSelector: '.details_block > .linkbar',
      keyWord: ['访问网站', 'Visit the website'],
    },
    category: 'website',
  }
  // {
  //   name: 'cover',
  //   selector: {
  //     selector: '#soft_table .highslide',
  //   },
  //   category: 'cover',
  // }
)

steamModel.defaultInfos = [
  {
    name: '平台',
    value: 'PC',
    category: 'platform',
  },
]
