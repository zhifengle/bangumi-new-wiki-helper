import { SubjectSourceDefinition, SubjectTypeId } from '../../interface/wiki';
import { cleanText, date, dom, fieldKind, firstOf } from '../core/extraction';

const info = dom('#album_infobit_large').find('tr > td:first-child');
const infoValue = (key: string | string[]) => info.hasText(key).next();
const credit = dom('#collapse_credits table').find('tr > td:first-child');
const creditValue = (key: string | string[]) => credit.hasText(key).next();

export const vgmdbSubject: SubjectSourceDefinition = {
  key: 'vgmdb',
  description: 'vgmdb',
  host: ['vgmdb.net'],
  type: SubjectTypeId.music,
  pageSource: dom('#innermain > h1'),
  controlSource: dom('#innermain > h1'),
  itemList: [
    {
      name: '厂牌',
      source: infoValue('Label'),
      read: fieldKind.preservedText().read,
      clean: cleanText.trim(),
    },
    {
      name: '条形码',
      source: infoValue('Barcode'),
      clean: cleanText.trim(),
    },
    {
      name: '发售日期',
      source: infoValue('Release Date').scope(dom('a')),
      parse: date(),
      emit: { category: 'date' },
    },
    { name: '价格', source: infoValue('Price') },
    { name: '版本特性', source: infoValue('Media Format') },
    {
      name: '播放时长',
      source: firstOf([
        dom('#tracklist').find('span.smallfont').hasText('Total length').next(),
        dom('#tracklist').find('span.smallfont').hasText('Disc length').next(),
      ]),
    },
    {
      name: '艺术家',
      source: creditValue(['Performer', 'Vocalist']),
      kind: fieldKind.preservedText(),
    },
    {
      name: '作曲',
      source: creditValue(['Composer', 'Music Written by', 'Composed by', 'Music by']),
      kind: fieldKind.preservedText(),
    },
    {
      name: '作词',
      source: creditValue(['Lyricist', 'Lyrics', 'Lyrics Written by', 'Words by']),
      kind: fieldKind.preservedText(),
    },
    {
      name: '编曲',
      source: creditValue(['Arranger', 'Arranged by', 'Arrangement']),
      kind: fieldKind.preservedText(),
    },
    {
      name: '声乐',
      source: creditValue(['Vocal', 'Vocals', 'Chorus']),
      kind: fieldKind.preservedText(),
    },
    {
      name: '录音',
      source: creditValue(['Recording', 'Recording Engineer', 'Recorded by']),
      kind: fieldKind.preservedText(),
    },
    {
      name: '混音',
      source: creditValue(['Mixing', 'Mixing Engineer', 'Mixed by']),
      kind: fieldKind.preservedText(),
    },
    {
      name: '母带制作',
      source: creditValue(['Mastering', 'Mastering Engineer', 'Mastered by']),
      kind: fieldKind.preservedText(),
    },
    {
      name: '制作人',
      source: creditValue([
        'Producer',
        'Executive Producer',
        'Music Producer',
        'Produced by',
        'All Songs Produced by',
      ]),
      kind: fieldKind.preservedText(),
    },
    {
      name: '插图',
      source: creditValue([
        'Illustrator',
        'Illustration',
        'Jacket Design',
        'Jacket Illustration',
        'Cover Art',
        'Art Direction',
      ]),
      kind: fieldKind.preservedText(),
    },
  ],
};
