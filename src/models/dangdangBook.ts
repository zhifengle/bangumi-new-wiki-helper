import { SiteConfig, SubjectTypeId } from '../interface/wiki';

export const dangdangBookModel: SiteConfig = {
  key: 'dangdang_book',
  host: ['product.dangdang.com'],
  description: '当当图书',
  type: SubjectTypeId.book,
  pageSelectors: [
    {
      selector: '#breadcrumb',
      subSelector: 'a',
      keyWord: '图书',
    },
  ],
  controlSelector: {
    selector: '.name_info h1',
  },
  itemList: [],
};
const infoSelector = {
  selector: '.messbox_info',
  subSelector: 'span',
};
const descSelector = {
  selector: '#detail_describe',
  subSelector: 'li',
};
dangdangBookModel.itemList.push(
  {
    name: '名称',
    selector: {
      selector: '.name_info h1',
    },
    category: 'subject_title',
  },
  // {
  //   name: 'cover',
  //   selector: {
  //     selector: 'img#largePic',
  //   },
  //   category: 'cover',
  // },
  {
    name: 'ISBN',
    selector: {
      ...descSelector,
      keyWord: '国际标准书号ISBN',
    },
    category: 'ISBN',
  },
  {
    name: '发售日',
    selector: {
      ...infoSelector,
      keyWord: '出版时间',
    },
    category: 'date',
  },
  {
    name: '作者',
    selector: [
      {
        ...infoSelector,
        keyWord: '作者',
      },
    ],
  },
  {
    name: '出版社',
    selector: {
      ...infoSelector,
      keyWord: '出版社',
    },
  },
  {
    name: '内容简介',
    selector: [
      {
        selector: '#content .descrip',
      },
    ],
    category: 'subject_summary',
  }
);
