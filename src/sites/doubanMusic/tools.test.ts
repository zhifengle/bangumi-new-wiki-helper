// @vitest-environment jsdom
import { SingleInfo } from '../../interface/subjectInfo';
import { doubanMusicTools } from './tools';

describe('douban music tools', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('parse metadata and build disc track groups', async () => {
    document.body.innerHTML = `
      <div id="info">
        <span class="pl">又名:</span>别名A
        <span class="pl">唱片数:</span>2
        <span class="pl">表演者:<a>艺术家甲</a><a>艺术家乙</a></span>
      </div>
      <div class="track-list">
        <ul class="track-items">
          <li data-track-order="1">Song 1 03:11</li>
          <li data-track-order="2">Song 2</li>
          <li data-track-order="0">Disc 2</li>
          <li data-track-order="1">Song 3 04:05</li>
        </ul>
      </div>
    `;

    const result = ((await doubanMusicTools.hooks?.afterGetWikiData?.([
      {
        name: '音乐简介',
        value: '已有简介',
        category: 'subject_summary',
      },
    ])) ?? []) as SingleInfo[];

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '别名',
          value: '别名A',
          category: 'alias',
        }),
        expect.objectContaining({
          name: '碟片数量',
          value: '2',
        }),
        expect.objectContaining({
          name: '艺术家',
          value: '艺术家甲、艺术家乙',
        }),
      ])
    );

    const epInfo = result.find((item) => item.category === 'ep');
    expect(epInfo?.value).toHaveLength(2);
    expect(epInfo?.value[0][0]).toEqual(
      expect.objectContaining({
        title: 'Song 1',
        duration: '03:11',
      })
    );
    expect(epInfo?.value[1][0]).toEqual(
      expect.objectContaining({
        title: 'Song 3',
        duration: '04:05',
      })
    );
  });
});

