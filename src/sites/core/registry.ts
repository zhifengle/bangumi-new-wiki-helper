import { CharaModelKey, ModelKey } from '../../interface/wiki';
import { dealDate } from '../../utils/utils';
import { adultComicTools } from '../adultcomic';
import { amazonJpBookTools, amazonJpMusicTools } from '../amazon';
import { dlsiteCharaTools, dlsiteTools } from '../dlsite';
import { dmmCharaTools, dmmTools } from '../dmm';
import { doubanGameEditTools, doubanMusicTools, doubanTools } from '../douban';
import { erogamescapeTools } from '../erogamescape';
import { getchuSiteTools } from '../getchu';
import { moepediaTools } from '../moepedia';
import { steamdbTools, steamTools } from '../steam';
import { SiteTools } from '../types';
import { vgmdbTools } from '../vgmdb';
import { trimParenthesis } from './trim';

export const siteToolsRegistry: Partial<Record<ModelKey, SiteTools>> = {
  amazon_jp_book: amazonJpBookTools,
  dangdang_book: {
    filters: [
      {
        category: 'date',
        dealFunc(str: string) {
          return dealDate(str.replace(/出版时间[:：]/, '').trim());
        },
      },
      {
        category: 'subject_title',
        dealFunc(str: string) {
          return trimParenthesis(str);
        },
      },
    ],
  },
  jd_book: {
    filters: [
      {
        category: 'subject_title',
        dealFunc(str: string) {
          return trimParenthesis(str);
        },
      },
    ],
  },
  getchu_game: getchuSiteTools,
  erogamescape: erogamescapeTools,
  steam_game: steamTools,
  steamdb_game: steamdbTools,
  douban_game: doubanTools,
  douban_game_edit: doubanGameEditTools,
  dlsite_game: dlsiteTools,
  dmm_game: dmmTools,
  adultcomic: adultComicTools,
  moepedia: moepediaTools,
  vgmdb: vgmdbTools,
  amazon_jp_music: amazonJpMusicTools,
  douban_music: doubanMusicTools,
};

export const charaToolsRegistry: Partial<Record<CharaModelKey, SiteTools>> = {
  dlsite_game_chara: dlsiteCharaTools,
  dmm_game_chara: dmmCharaTools,
};
