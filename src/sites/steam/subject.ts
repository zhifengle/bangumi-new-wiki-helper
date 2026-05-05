import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import {
  attr,
  cleanText,
  date,
  dom,
  fieldKind,
  firstOf,
  queryParam,
} from '../core/extraction';

export const steamSubject: SubjectSourceDefinition = {
  key: 'steam_game',
  description: 'steam',
  host: ['store.steampowered.com'],
  type: SubjectTypeId.game,
  pageSource: dom('.apphub_AppName'),
  controlSource: dom('.apphub_AppName'),
  itemList: [
    {
      name: '游戏名',
      source: dom('.apphub_AppName'),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    {
      name: '发行日期',
      source: dom('.release_date .date'),
      parse: date(),
      emit: { category: 'date' },
    },
    {
      name: '开发',
      source: dom('.glance_ctn_responsive_left .user_reviews')
        .find('.dev_row .subtitle')
        .hasText(['开发商', 'DEVELOPER'])
        .next(),
    },
    {
      name: '发行',
      source: dom('.glance_ctn_responsive_left .user_reviews')
        .find('.dev_row .subtitle')
        .hasText(['发行商', 'PUBLISHER'])
        .next(),
    },
    {
      name: 'website',
      source: dom('.responsive_apppage_details_left.game_details')
        .find('.details_block > .linkbar')
        .hasText(['访问网站', 'Visit the website']),
      read: attr('href'),
      clean: false,
      parse: queryParam('url'),
      emit: { category: 'website,listItem' },
    },
    {
      name: '游戏简介',
      source: firstOf([
        dom('.game_description_snippet'),
        dom('head meta[name="description"]'),
        dom('#game_area_description'),
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
  ],
};
