import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import {
  cleanText,
  dateRangeStart,
  dom,
  fieldKind,
  firstOf,
  removeParenthesis,
  trimAllSpace,
} from '../core/extraction';

const detailsLabel = dom('#info table').find('td');
const localized = (key: string) =>
  detailsLabel.hasText('name_localized').next().scope(
    dom('table.web-assets').find('td').hasText(key).next()
  );
const appRow = (key: string) =>
  dom('.scope-app .app-row table').find('td').hasText(key).next();
const assetsTable = dom('#js-assets-table').find('td');

export const steamdbSubject: SubjectSourceDefinition = {
  key: 'steamdb_game',
  description: 'steamdb',
  host: ['steamdb.info'],
  type: SubjectTypeId.game,
  pageSource: dom('.pagehead h1'),
  controlSource: dom('.pagehead'),
  itemList: [
    {
      name: '游戏名',
      source: firstOf([localized('japanese'), dom('.pagehead h1')]),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    {
      name: '中文名',
      source: firstOf([localized('schinese'), localized('tchinese')]),
      kind: fieldKind.preservedText(),
      emit: { category: 'alias' },
    },
    {
      name: '游戏类型',
      source: detailsLabel.hasText('Primary Genre').next(),
      clean: cleanText.chain([trimAllSpace(), removeParenthesis()]),
    },
    {
      name: 'cover',
      source: firstOf([
        assetsTable.hasText('library_assets').next().scope(
          dom('table.web-assets')
            .find('td')
            .hasText('library_capsule')
            .next()
            .scope(dom('a'))
        ),
        assetsTable
          .hasText('Web Assets')
          .next()
          .scope(dom('table.web-assets').find('td > a').hasText('library_600x900')),
      ]),
      kind: fieldKind.cover(),
      emit: { category: 'cover' },
    },
    {
      name: '发行日期',
      source: appRow('Release Date'),
      parse: dateRangeStart(),
      emit: { category: 'date' },
    },
    {
      name: '开发',
      source: appRow('Developer'),
    },
    {
      name: '发行',
      source: appRow('Publisher'),
    },
    {
      name: '游戏引擎',
      source: appRow('Technologies'),
      transform: (value) =>
        typeof value === 'string' ? value.replace(/^Engine\./g, '') : value,
    },
    {
      name: '游戏简介',
      source: firstOf([
        dom('.scope-app .header-description'),
        dom('head meta[name="description"]'),
      ]),
      kind: fieldKind.preservedText(),
      transform: (value) => {
        if (
          typeof value === 'string' &&
          value.match(/\n.*?Steam charts, data, update history\.$/)
        ) {
          return value.split('\n')[0];
        }
        return value;
      },
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
