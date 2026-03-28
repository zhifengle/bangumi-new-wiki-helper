import { SubjectWikiInfo } from '../../../interface/subject';
import { SubjectTypeId } from '../../../interface/wiki';
import { getSubmitBtnText } from './submit';

function createWikiInfo(infos: SubjectWikiInfo['infos']): SubjectWikiInfo {
  return {
    type: SubjectTypeId.music,
    infos,
  };
}

describe('newSubject submit helpers', () => {
  const globalAny = globalThis as any;
  const originalLocation = globalAny.location;

  function setPath(pathname: string) {
    Object.defineProperty(globalAny, 'location', {
      configurable: true,
      value: { pathname },
    });
  }

  afterAll(() => {
    if (originalLocation === undefined) {
      delete globalAny.location;
      return;
    }
    Object.defineProperty(globalAny, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  test('returns default text for non music-subject page', () => {
    setPath('/new_subject/1');
    const wikiInfo = createWikiInfo([{ name: '曲目', value: '1', category: 'ep' }]);
    expect(getSubmitBtnText(wikiInfo)).toBe('添加条目并上传封面');
  });

  test('returns ep text for music page with ep info', () => {
    setPath('/new_subject/3');
    const wikiInfo = createWikiInfo([{ name: '曲目', value: '1', category: 'ep' }]);
    expect(getSubmitBtnText(wikiInfo)).toBe('添加条目并上传封面、添加曲目');
  });

  test('returns default text for music page without ep info', () => {
    setPath('/new_subject/3');
    const wikiInfo = createWikiInfo([{ name: '标题', value: 'abc' }]);
    expect(getSubmitBtnText(wikiInfo)).toBe('添加条目并上传封面');
  });
});
