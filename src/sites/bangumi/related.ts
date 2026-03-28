import { fetchJson, fetchText } from '../../utils/fetchData';
import { SubjectTypeId } from '../../interface/wiki';
import { FormItem, sendForm, sendFormImg } from '../../utils/ajax';
import { getBgmHost, getFormByIframe } from './common';
import { dataURItoBlob } from '../../utils/dealImage';
import { SingleInfo, SubjectWikiInfo } from '../../interface/subjectInfo';
import { MusicDiscTrack } from '../../interface/types';
import { sleep } from '../../utils/async/sleep';
import { genRandomStr } from '../../utils/utils';

type SubjectCoverUploadResult = Response | string | void;
type CVSearchResult = Record<string, unknown>;

function getBangumiSubjectTypeName(typeId: SubjectTypeId) {
  const typeDict: Record<SubjectTypeId, string> = {
    [SubjectTypeId.game]: 'game',
    [SubjectTypeId.anime]: 'anime',
    [SubjectTypeId.music]: 'music',
    [SubjectTypeId.book]: 'book',
    [SubjectTypeId.real]: 'real',
    [SubjectTypeId.all]: 'all',
  };
  return typeDict[typeId];
}

function isDiscTrackList(value: SingleInfo['value']): value is MusicDiscTrack[][] {
  return Array.isArray(value) && value.every((disc) => Array.isArray(disc));
}

export async function uploadSubjectCover(
  subjectId: string,
  dataUrl: string,
  bgmHost: string = ''
): Promise<SubjectCoverUploadResult> {
  if (!bgmHost) {
    bgmHost = `${location.protocol}//${location.host}`;
  }
  const url = `${bgmHost}/subject/${subjectId}/upload_img`;
  const $hash = document.querySelector<HTMLInputElement>(
    'form > input[name="formhash"]'
  );
  if ($hash) {
    const fd = new FormData();
    fd.set('formhash', $hash.value);
    fd.set('picfile', dataURItoBlob(dataUrl), genRandomStr(5) + '.png');
    fd.set('submit', '上传图片');
    return await fetch(url, {
      body: fd,
      method: 'post',
    });
  } else {
    const rawText = await fetchText(url);
    const $doc = new DOMParser().parseFromString(rawText, 'text/html');
    const $form = $doc.querySelector<HTMLFormElement>('form[name=img_upload]');
    if (!$form) {
      console.error('获取封面表单失败');
      return;
    }
    await sendFormImg($form, dataUrl);
  }
}

export async function addMusicEp(
  subjectId: string,
  wikiInfo: SubjectWikiInfo,
  log: (str: string) => void = (str) => console.log(str)
) {
  if (location.pathname !== '/new_subject/3') {
    return;
  }
  // 音乐条目，添加ep
  const discInfo = wikiInfo.infos.find(
    (item: SingleInfo) => item.category === 'ep'
  );
  if (discInfo && isDiscTrackList(discInfo.value)) {
    for (let i = 0; i < discInfo.value.length; i++) {
      const track = discInfo.value[i];
      const songlist = track.map((obj: MusicDiscTrack) => obj.title).join('\n');
      await addSonglist(subjectId, songlist, String(i + 1));
      log(`Disc${i + 1}: 添加曲目成功`);
      await sleep(500);
    }
  }
}

export async function addSonglist(
  subjectId: string,
  songlist: string,
  disc: string = '1'
) {
  const $hash = document.querySelector<HTMLInputElement>(
    'form > input[name="formhash"]'
  );
  if ($hash) {
    const fd = new FormData();
    fd.set('formhash', $hash.value);
    fd.set('songlist', songlist);
    fd.set('disc', disc);
    fd.set('submit', '加上去');
    const res = await fetch(`/subject/${subjectId}/songlist/new`, {
      body: fd,
      method: 'post',
    });
    // if (res.status === 302) {
    //   const location = res.headers.get('Location');
    //   console.log('Redirected to:', location);
    //   return await fetch(location);
    // }
    return res;
  } else {
    const rawText = await fetchText(`/subject/${subjectId}/ep`);
    const $doc = new DOMParser().parseFromString(rawText, 'text/html');
    const $form = $doc.querySelector<HTMLFormElement>('form[name=new_songlist]');
    if (!$form) {
      console.error('获取封面表单失败');
      return;
    }
    await sendForm($form, [
      {
        name: 'songlist',
        value: songlist,
      },
      {
        name: 'disc',
        value: disc,
      },
      {
        name: 'submit',
        value: '加上去',
      },
    ]);
  }
}

export async function searchCVByName(name: string, charaId: string = '') {
  const bgmHost = getBgmHost();
  let url = `${bgmHost}/json/search-cv_person/${name.replace(/\s/g, '')}`;
  if (charaId) {
    url = `${url}?character_id=${charaId}`;
  }
  const res = await fetchJson(url) as CVSearchResult;
  return Object.keys(res)[0];
}

// 添加角色的关联条目
export async function addPersonRelatedSubject(
  subjectIds: string[],
  charaId: string,
  typeId: SubjectTypeId,
  charaType: number = 1
) {
  const bgmHost = `${location.protocol}//${location.host}`;
  const type = getBangumiSubjectTypeName(typeId);
  const url = `${bgmHost}/character/${charaId}/add_related/${type}`;
  const $form = await getFormByIframe(url, '.mainWrapper form');
  const extroInfo: FormItem[] = [];
  // 1 主角 2 配角 3 客串
  subjectIds.forEach((v, i) => {
    extroInfo.push({
      name: `infoArr[n${i}][crt_type]`,
      value: charaType,
    });
    extroInfo.push({
      name: `infoArr[n${i}][subject_id]`,
      value: v,
    });
  });
  // {name: 'submit', value: '保存关联数据'}
  await sendForm($form, [...extroInfo]);
}

// 未设置域名的兼容，只能在 Bangumi 本身上面使用
// 添加角色的关联 CV
export async function addPersonRelatedCV(
  subjectId: string,
  charaId: string,
  personIds: string[],
  typeId: SubjectTypeId
) {
  const bgmHost = `${location.protocol}//${location.host}`;
  const type = getBangumiSubjectTypeName(typeId);
  const url = `${bgmHost}/character/${charaId}/add_related/person/${type}`;
  const rawText = await fetchText(url);
  const $doc = new DOMParser().parseFromString(rawText, 'text/html');
  const $form = $doc.querySelector<HTMLFormElement>('.mainWrapper form');
  if (!$form) {
    throw new Error('related person form not found');
  }
  const personInfo: FormItem[] = personIds.map((v, i) => ({
    name: `infoArr[n${i}][prsn_id]`,
    value: v,
  }));
  // {name: 'submit', value: '保存关联数据'}
  await sendForm($form, [
    {
      name: 'infoArr[n0][subject_id]',
      value: subjectId,
    },
    {
      name: 'infoArr[n0][subject_type_id]',
      value: typeId,
    },
    ...personInfo,
  ]);
}

