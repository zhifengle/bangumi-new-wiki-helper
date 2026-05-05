import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { dom, fieldKind } from '../core/extraction';

export const doubanMusicSubject: SubjectSourceDefinition = {
  key: 'douban_music',
  description: 'douban music',
  host: ['music.douban.com'],
  type: SubjectTypeId.music,
  pageSource: dom('#db-nav-music'),
  controlSource: dom('#wrapper h1'),
  itemList: [
    {
      name: '音乐名',
      source: dom('#wrapper h1'),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_title' },
    },
    {
      name: '音乐简介',
      source: dom('.related_info').find('h2').hasText('简介').next(),
      kind: fieldKind.preservedText(),
      emit: { category: 'subject_summary' },
    },
    {
      name: 'cover',
      source: dom('#mainpic > span > a > img'),
      kind: fieldKind.cover(),
      emit: { category: 'cover' },
    },
  ],
};
