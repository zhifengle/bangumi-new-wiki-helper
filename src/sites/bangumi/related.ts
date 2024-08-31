import { fetchJson, fetchText } from '../../utils/fetchData';
import { SubjectTypeId } from '../../interface/wiki';
import { sendForm, sendFormImg } from '../../utils/ajax';
import { getBgmHost, getFormByIframe } from './common';
import { genRandomStr } from '../../utils/utils';
import { dataURItoBlob } from '../../utils/dealImage';
import { SingleInfo, SubjectWikiInfo } from '../../interface/subject';
import { MusicDiscTrack } from '../../interface/types';
import { sleep } from '../../utils/async/sleep';
import { loadIframe } from '../../utils/domUtils';

export async function uploadSubjectCover(
  subjectId: string,
  dataUrl: string,
  bgmHost: string = ''
) {
  if (!bgmHost) {
    bgmHost = `${location.protocol}//${location.host}`;
  }
  const url = `${bgmHost}/subject/${subjectId}/upload_img`;
  const $hash = document.querySelector(
    'form > input[name="formhash"]'
  ) as HTMLInputElement;
  if ($hash) {
    const fd = new FormData();
    fd.set('formhash', $hash.value);
    fd.set('picfile', dataURItoBlob(dataUrl), genRandomStr(5) + '.png');
    fd.set('submit', '上传图片');
    const res = await fetch(url, {
      body: fd,
      method: 'post',
    });
  } else {
    const rawText = await fetchText(url);
    const $doc = new DOMParser().parseFromString(rawText, 'text/html');
    const $form = $doc.querySelector('form[name=img_upload') as HTMLFormElement;
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
  if (discInfo) {
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
  const $hash = document.querySelector(
    'form > input[name="formhash"]'
  ) as HTMLInputElement;
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
    const $form = $doc.querySelector(
      'form[name=new_songlist'
    ) as HTMLFormElement;
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
      }
    ]);
  }
}

export async function searchCVByName(name: string, charaId: string = '') {
  const bgmHost = getBgmHost();
  let url = `${bgmHost}/json/search-cv_person/${name.replace(/\s/g, '')}`;
  if (charaId) {
    url = `${url}?character_id=${charaId}`;
  }
  const res = await fetchJson(url);
  return Object.keys(res)[0];
}

// 添加角色的关联条目
export async function addPersonRelatedSubject(
  subjectIds: string[],
  charaId: string,
  typeId: SubjectTypeId,
  charaType: number = 1
) {
  const typeDict = {
    [SubjectTypeId.game]: 'game',
    [SubjectTypeId.anime]: 'anime',
    [SubjectTypeId.music]: 'music',
    [SubjectTypeId.book]: 'book',
    [SubjectTypeId.real]: 'real',
    [SubjectTypeId.all]: 'all',
  };
  const bgmHost = `${location.protocol}//${location.host}`;
  const type = typeDict[typeId];
  const url = `${bgmHost}/character/${charaId}/add_related/${type}`;
  const $form = await getFormByIframe(url, '.mainWrapper form');
  const extroInfo: any = [];
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
  const typeDict = {
    [SubjectTypeId.game]: 'game',
    [SubjectTypeId.anime]: 'anime',
    [SubjectTypeId.music]: 'music',
    [SubjectTypeId.book]: 'book',
    [SubjectTypeId.real]: 'real',
    [SubjectTypeId.all]: 'all',
  };
  const bgmHost = `${location.protocol}//${location.host}`;
  const type = typeDict[typeId];
  const url = `${bgmHost}/character/${charaId}/add_related/person/${type}`;
  const rawText = await fetchText(url);
  const $doc = new DOMParser().parseFromString(rawText, 'text/html');
  const $form = $doc.querySelector('.mainWrapper form') as HTMLFormElement;
  const personInfo = personIds.map((v, i) => ({
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
