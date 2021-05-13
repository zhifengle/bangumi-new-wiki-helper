import { SubjectWikiInfo } from '../interface/subject';
import { SubjectTypeId } from '../interface/wiki';

export const book: SubjectWikiInfo = {
  type: SubjectTypeId.book,
  subtype: 1,
  infos: [
    {
      name: '名称',
      value: 'test',
      category: 'subject_title',
    },
    {
      name: '内容简介',
      value: 'test summary',
      category: 'subject_summary',
    },
    {
      name: 'ASIN',
      value: '4785963816',
      category: 'ISBN',
    },
    {
      name: 'ISBN',
      value: '978-4785963811',
      category: 'ISBN-13',
    },
    {
      name: '发售日',
      value: '2019/2/16',
      category: 'date',
    },
    {
      name: '作者',
      value: '宮尾 岳',
    },
    {
      name: '出版社',
      value: '少年画報社',
    },
    {
      name: '页数',
      value: '162',
    },
  ],
};

export const testUrls: string[] = [
  // 蒼の彼方のフォーリズム
  'https://steamdb.info/app/1044620/info/',
  'https://steamdb.info/app/1121560/info/',
  'https://steamdb.info/app/955560/info/',
  'https://www.amazon.co.jp/dp/4757556977',
  'http://product.dangdang.com/27914599.html',
  'https://item.jd.com/12816538.html',
  'http://www.getchu.com/soft.phtml?id=1080370',
  // getchu doujin
  'http://www.getchu.com/soft.phtml?id=1121555',
  // pray game
  'https://www.dlsite.com/maniax/work/=/product_id/RJ266116.html',
  // 魔法少女セレスフォニア
  'https://www.dlsite.com/maniax/work/=/product_id/RJ297120.html',
  // 死神教団
  'https://www.dlsite.com/maniax/work/=/product_id/RJ309886.html',
  // 小粥姉妹
  'https://dlsoft.dmm.co.jp/detail/akbs_0126/',
  // スタディ§ステディ
  'https://dlsoft.dmm.co.jp/detail/russ_0307',
  // ゆびさきコネクション
  'https://dlsoft.dmm.co.jp/detail/has_0091',
];
