import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { attr, date, dom, fieldKind, removeParenthesis, cleanText } from '../core/extraction';

const topTable = dom(
  'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-top > div.body-top_table.body-table > table'
).find('tr > th');
const middleTable = dom(
  'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-middle'
).find('tr > th');

export const moepediaSubject: SubjectSourceDefinition = {
  key: 'moepedia',
  description: 'moepedia.net',
  host: ['moepedia.net'],
  type: SubjectTypeId.game,
  pageSource: dom('.gme-Contents > .gme-Body'),
  controlSource: dom('.body-top_info_title > h2'),
  itemList: [
    {
      name: '游戏名',
      source: dom('div.gme-Contents h2'),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    {
      name: '发行日期',
      source: topTable.hasText('発売日').next(),
      parse: date(),
      emit: { category: 'date' },
    },
    {
      name: '售价',
      source: topTable.hasText('価格').next(),
      clean: cleanText.chain([removeParenthesis()]),
    },
    {
      name: 'website',
      source: dom(
        'body > div.st-Container.visible > div.gme-Contents > div > div > div.body-top > div.body-top_table.body-table > div > a'
      ),
      read: attr('href'),
      clean: false,
      emit: { category: 'website' },
    },
    {
      name: 'cover',
      source: dom('div.gme-Contents div.body-top > div.body-top_image img'),
      kind: fieldKind.cover(),
      emit: { category: 'cover' },
    },
    { name: '原画', source: middleTable.hasText(['原画']).next() },
    { name: '开发', source: middleTable.hasText(['ブランド']).next() },
    { name: '剧本', source: middleTable.hasText(['シナリオ']).next() },
    { name: '游戏类型', source: middleTable.hasText(['ジャンル']).next() },
    { name: '音乐', source: middleTable.hasText(['音楽']).next() },
    { name: '主题歌演唱', source: middleTable.hasText(['歌手']).next() },
  ],
  defaults: [
    { name: '平台', value: 'PC', category: 'platform' },
    { name: 'subject_nsfw', value: '1', category: 'checkbox' },
  ],
};
