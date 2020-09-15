import { getAllPageInfo, getBgmHost } from './common';
import { downloadFile, htmlToElement } from '../../utils/domUtils';
import { formatDate } from '../../utils/utils';
import { SubjectItem } from '../../interface/types';

function genCSVContent(res: SubjectItem[]) {
  const hostUrl = getBgmHost();
  let csvContent =
    '\ufeff名称,别名,发行日期,地址,封面地址,收藏日期,我的评分,标签,吐槽,其它信息';
  res.forEach((item) => {
    csvContent += `\r\n${item.name || ''},${item.greyName || ''},${
      item.releaseDate || ''
    }`;
    const subjectUrl = hostUrl + item.url;
    csvContent += `,${subjectUrl}`;
    const cover = item.cover || '';
    csvContent += `,${cover}`;
    const collectInfo: any = item.collectInfo || {};
    const collectDate = collectInfo.date || '';
    csvContent += `,${collectDate}`;
    const score = collectInfo.score || '';
    csvContent += `,${score}`;
    const tag = collectInfo.tag || '';
    csvContent += `,${tag}`;
    const comment = collectInfo.comment || '';
    csvContent += `,"${comment}"`;
    const rawInfos = item.rawInfos || '';
    csvContent += `,"${rawInfos}"`;
  });
  return csvContent;
}

export function addExportBtn() {
  const $nav = document.querySelector('#headerProfile .navSubTabs');
  if (!$nav) return;
  const btnStr = `<li><a href="#"><span style="color:tomato;">导出收藏</span></a></li>`;
  const $node = htmlToElement(btnStr);
  $node.addEventListener('click', async (e) => {
    const $text = ($node as HTMLElement).querySelector('span');
    $text.innerText = '导出中...';
    const $username = document.querySelector('.nameSingle .inner>a');
    let name = '导出收藏';
    const type = $nav.querySelector('.focus')?.textContent || '';
    if ($username) {
      name = $username.textContent;
    }
    const res = await getAllPageInfo(location.href);
    const csv = genCSVContent(res);
    $text.innerText = '导出完成';
    downloadFile(csv, `${name}-${type}-${formatDate(new Date())}.csv`);
  });
  $nav.appendChild($node);
}
