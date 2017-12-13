import SubjectConfigModel from './SubjectConfigModel.js'

var amazonSubjectModel = new SubjectConfigModel({
  key: 'amazon_jp_book',
  description: '日亚图书',
  entrySelector: 'xx',
  targetURL: 'xxx',
  cover: {
    selector: 'img#imgBlkFront'
  }
})
amazonSubjectModel.itemList.push(
  {
    name: '名称',
    selector: '#productTitle',
    keyWord: '',
    category: 'subject_title'
  },
  {
    name: 'ISBN',
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    keyWord: 'ISBN-10:'
  },
  {
    name: '发售日',
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    keyWord: '発売日：',
    category: 'date'
  },
  {
    name: '作者',
    selector: '#byline .author span.a-size-medium'
  },
  {
    name: '出版社',
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    keyWord: '出版社'
  },
  {
    name: '页数',
    selector: '#detail_bullets_id .bucket .content',
    subSelector: 'li',
    keyWord: 'コミック:'
  },
  {
    name: '价格',
    selector: '.swatchElement.selected .a-color-base'
  },
  {
    name: '内容简介',
    selector: '#productDescription p',
    category: 'subject_summary'
  }
)
export default amazonSubjectModel;
