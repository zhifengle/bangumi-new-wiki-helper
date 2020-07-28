import { SiteConfig, SubjectTypeId } from '../interface/wiki';

export const jdBookModel: SiteConfig = {
  key: 'jd_book',
  host: ['item.jd.com'],
  description: '京东图书',
  type: SubjectTypeId.book,
  pageSelectors: [
    {
      selector: '#crumb-wrap',
      subSelector: '.item > a',
      keyWord: '图书',
    },
  ],
  controlSelector: {
    selector: '#name .sku-name',
  },
  itemList: [],
};

const descSelector = {
  selector: '#parameter2',
  subSelector: 'li',
};
jdBookModel.itemList.push(
  {
    name: '名称',
    selector: {
      selector: '#name .sku-name',
    },
    category: 'subject_title',
  },
  // {
  //   name: 'cover',
  //   selector: {
  //     selector: '#preview img',
  //   },
  //   category: 'cover',
  // },
  {
    name: 'ISBN',
    selector: {
      ...descSelector,
      keyWord: 'ISBN',
    },
    category: 'ISBN',
  },
  {
    name: '发售日',
    selector: {
      ...descSelector,
      keyWord: '出版时间',
    },
    category: 'date',
  },
  {
    name: '作者',
    selector: [
      {
        selector: '#p-author',
        keyWord: '著',
      },
    ],
  },
  {
    name: '出版社',
    selector: {
      ...descSelector,
      keyWord: '出版社',
    },
  },
  {
    name: '内容简介',
    selector: [
      {
        selector: '.book-detail-item',
        subSelector: '.item-mt',
        keyWord: '内容简介',
        sibling: true,
      },
    ],
    category: 'subject_summary',
  }
);
