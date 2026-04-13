import { getFormByIframe } from './forms';

type IInterestData = {
  // 想看 看过 在看 搁置 抛弃
  interest: '1' | '2' | '3' | '4' | '5';
  tags?: string;
  comment?: string;
  rating?: string;
  // 1 为自己可见
  privacy?: '1' | '0';
};

/**
 * 更新用户收藏
 * @param subjectId 条目 id
 * @param data 更新数据
 */
export async function updateInterest(subjectId: string, data: IInterestData) {
  // gh 暂时不知道如何获取，直接拿 action 了
  const $form = await getFormByIframe(
    `/update/${subjectId}`,
    '#collectBoxForm'
  );
  const formData = new FormData($form);
  const obj = Object.assign(
    { referer: 'ajax', tags: '', comment: '', update: '保存' },
    data
  );
  for (let [key, val] of Object.entries(obj)) {
    if (!formData.has(key)) {
      formData.append(key, val);
    }
  }
  return await fetch($form.action, {
    method: 'POST',
    body: formData,
  });
}
