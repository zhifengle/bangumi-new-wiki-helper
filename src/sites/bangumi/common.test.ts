/**
 * @jest-environment jsdom
 */
import { convertItemInfo, getItemInfos, getTotalPageNum } from './common';

function createSubjectItemMarkup() {
  return `
    <li>
      <div class="subjectCover">
        <img src="https://lain.bgm.tv/pic/cover/s/test.jpg" />
      </div>
      <h3>
        <a class="l" href="/subject/123">测试条目</a>
        <span class="grey">Test Subject</span>
      </h3>
      <div class="info">2024-03-01 / 12话</div>
      <div class="rateInfo">
        <span class="fade">8.2</span>
        <span class="tip_j">123人评分</span>
      </div>
      <small class="rank">Rank 42</small>
      <div class="collectInfo">
        2024-04-01 / 标签: 百合
        <span class="starlight stars8"></span>
      </div>
      <div id="comment_box">个人吐槽</div>
    </li>
  `;
}

describe('bangumi common helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('convertItemInfo extracts list card details', () => {
    document.body.innerHTML = createSubjectItemMarkup();
    const item = document.querySelector<HTMLElement>('li')!;

    expect(convertItemInfo(item)).toEqual({
      name: '测试条目',
      rawInfos: '2024-03-01 / 12话',
      url: '/subject/123',
      greyName: 'Test Subject',
      releaseDate: '2024-03-01',
      rank: '42',
      cover: 'https://lain.bgm.tv/pic/cover/l/test.jpg',
      rateInfo: {
        score: '8.2',
        count: '123',
      },
      collectInfo: {
        date: '2024-04-01',
        tags: '百合',
        comment: '个人吐槽',
        score: '8',
      },
    });
  });

  test('getItemInfos and getTotalPageNum read list pages safely', () => {
    document.body.innerHTML = `
      <ul id="browserItemList">
        ${createSubjectItemMarkup()}
        ${createSubjectItemMarkup().replace('/subject/123', '/subject/456')}
      </ul>
      <div id="multipage">
        <div class="page_inner">
          <a class="p" href="/list?page=1">1</a>
          <a class="p" href="/list?page=2">2</a>
          <a class="p" href="/list?page=5">5</a>
        </div>
      </div>
    `;

    const items = getItemInfos();

    expect(items).toHaveLength(2);
    expect(items[1].url).toBe('/subject/456');
    expect(getTotalPageNum()).toBe(5);
  });

  test('getTotalPageNum falls back to one without pager', () => {
    expect(getTotalPageNum()).toBe(1);
  });
});
