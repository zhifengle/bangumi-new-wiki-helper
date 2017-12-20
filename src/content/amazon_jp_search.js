import browser from 'webextension-polyfill';

async function getItemInfo($li) {
  if (!$li || !/result/.test($li.getAttribute('id'))) return;
  let cover = $li.querySelector('img.s-access-image');
  let coverURL = '';
  if (cover) {
    coverURL = cover.getAttribute('src');
  }
  let $mini = $li.querySelector('.a-spacing-mini');
  if ($mini) {
    let href = $mini.querySelector('a.s-access-detail-page').getAttribute('href');
    let title = $mini.querySelector('h2').innerText.trim();
    let info = $mini.innerText.trim().replace('title', '');
    let base64Data = await getImageDataByURL(coverURL);
    return {
      href,
      title,
      info,
      base64Data
    };
  }
}

async function init($doc) {
  if (!$doc) {
    let whiteList = ['amazon.co.jp'];
    if (!window.location.host.match(new RegExp(whiteList.join('|')))) {
      console.info('domain is not in whitelist');
      return;
    }
    window.$doc = document;
  } else {
    window.$doc = $doc;
  }
}
