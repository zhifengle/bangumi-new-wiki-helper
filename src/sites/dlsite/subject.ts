import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { attr, dateFromFirstMatch, dom, fieldKind, firstOf } from '../core/extraction';

const outline = dom('#work_outline').find('th');
const outlineValue = (key: string | string[]) => outline.hasText(key).next();
const splitSlash = (value) =>
  typeof value === 'string' && !/http/.test(value) && value.includes('/')
    ? value.split('/').map((s) => s.trim()).join(', ')
    : value;

export const dlsiteSubject: SubjectSourceDefinition = {
  key: 'dlsite_game',
  description: 'dlsite游戏',
  host: ['dlsite.com', 'www.dlsite.com'],
  type: SubjectTypeId.game,
  pageSource: firstOf([
    dom('.floorTab-item.type-doujin.is-active'),
    dom('.floorTab-item.type-com.is-active'),
  ]),
  controlSource: dom('#work_name'),
  itemList: [
    {
      name: '游戏名',
      source: dom('#work_name'),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    {
      name: '开发',
      source: dom('#work_maker .maker_name a'),
    },
    {
      name: '发行日期',
      source: outlineValue(['販売日', '贩卖日', '販賣日']),
      parse: dateFromFirstMatch(),
      emit: { category: 'date' },
    },
    ...[
      ['作者', ['作者']],
      ['原画', ['イラスト', '插画']],
      ['剧本', ['シナリオ', '剧情']],
      ['声优', ['声優', '声优']],
      ['音乐', ['音乐', '音楽']],
    ].map(([name, keys]) => ({
      name: name as string,
      source: outlineValue(keys as string[]),
      transform: splitSlash,
    })),
    {
      name: 'cover',
      source: dom(
        '#work_left  div.slider_body_inner.swiper-container-horizontal > ul > li.slider_item:first-child > picture > img'
      ),
      kind: fieldKind.cover(),
      emit: { category: 'cover' },
    },
    {
      name: '游戏简介',
      source: firstOf([
        dom('.work_parts_container').find('.work_parts_heading').hasText('あらすじ').next(),
        dom('#intro-title + div'),
      ]),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_summary' },
    },
    {
      name: 'website',
      source: dom('#work_name > a'),
      read: attr('href'),
      clean: false,
      emit: { category: 'website' },
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
