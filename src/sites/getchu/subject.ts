import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import {
  cleanText,
  date,
  dom,
  fieldKind,
  firstOf,
  strip,
} from '../core/extraction';
import { createStartsWithPattern } from '../../utils/textPattern';
import { getchuTools } from './tools';

const infoTable = dom('#soft_table table').find('td');
const labeledInfo = (key: string | string[]) =>
  infoTable.hasText(Array.isArray(key) ? key.map(createStartsWithPattern) : createStartsWithPattern(key)).next();

const dict = [
  ['定価', '售价'],
  ['発売日', '发行日期'],
  ['ジャンル', '游戏类型'],
  ['ブランド', '开发'],
  ['原画', '原画'],
  ['音楽', '音乐'],
  ['シナリオ', '剧本'],
  ['アーティスト', '主题歌演出'],
  ['作詞', '主题歌作词'],
  ['作曲', '主题歌作曲'],
] as const;

export const getchuSubject: SubjectSourceDefinition = {
  key: 'getchu_game',
  description: 'Getchu游戏',
  host: ['getchu.com', 'www.getchu.com'],
  type: SubjectTypeId.game,
  pageSource: dom('.genretab.current').find('a').hasText(['ゲーム', '同人']),
  controlSource: dom('#soft-title'),
  itemList: [
    {
      name: '游戏名',
      source: dom('#soft-title'),
      kind: fieldKind.preservedText(),
      transform: (value) =>
        typeof value === 'string' ? getchuTools.dealTitle(value) : value,
      emit: { category: 'subject_title' },
    },
    {
      name: 'cover',
      source: firstOf([
        dom('#soft_table .highslide'),
        dom('#soft_table .highslide img'),
      ]),
      kind: fieldKind.cover({ referer: 'sourceUrl' }),
      emit: { category: 'cover' },
    },
    ...dict.map(([key, name]) => ({
      name,
      source: labeledInfo(key),
      parse: key === '発売日' ? date() : undefined,
      emit: key === '発売日' ? { category: 'date' } : undefined,
    })),
    {
      name: '游戏简介',
      source: firstOf([
        dom('#wrapper').find('.tabletitle').hasText('ストーリー').next(),
        dom('#wrapper').find('.tabletitle').hasText(['作品紹介', 'あらすじ']).next(),
        dom('#wrapper').find('.tabletitle').hasText('商品紹介').next(),
      ]),
      kind: fieldKind.preservedText(),
      clean: cleanText.preserve(),
      emit: { category: 'subject_summary' },
    },
  ],
  defaults: [
    {
      name: '平台',
      value: 'PC',
      category: 'platform',
    },
    {
      name: 'subject_nsfw',
      value: '1',
      category: 'checkbox',
    },
  ],
};
