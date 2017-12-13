import SubjectConfigModel from './SubjectConfigModel.js'

var getchuSubjectModel = new SubjectConfigModel({
  key: 'getchu_game',
  description: 'Getchu游戏',
  entrySelector: 'xx',
  targetURL: 'xx'
})
getchuSubjectModel.itemList.push(
  {
    name: '游戏名',
    selector: '#soft-title',
    keyWord: '',
    category: 'title'
  },
  {
    name: '开发',
    selector: '#soft_table',
    subSelector: 'tr',
    keyWord: 'ブランド：'
  },
  {
    name: '音乐',
    selector: '#soft_table',
    subSelector: 'tr',
    keyWord: '音楽：'
  },
  {
    name: '剧本',
    selector: '#soft_table',
    subSelector: 'tr',
    keyWord: 'シナリオ'
  },
  {
    name: '主题歌演出',
    selector: '#soft_table',
    subSelector: 'tr',
    keyWord: 'アーティスト'
  },
  {
    name: '主题歌作词',
    selector: '#soft_table',
    subSelector: 'tr',
    keyWord: '作詞'
  },
  {
    name: '主题歌作曲',
    selector: '#soft_table',
    subSelector: 'tr',
    keyWord: '作曲'
  },
  {
    name: '游戏简介',
    selector: '',
    keyWord: 'ストーリー',
    subSelector: 'div',
    sibling: true
  }
)
export default getchuSubjectModel;
