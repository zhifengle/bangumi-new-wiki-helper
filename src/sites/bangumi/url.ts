export function getBgmHost() {
  return `${location.protocol}//${location.host}`;
}

export function getSubjectId(url: string) {
  const m = url.match(/(?:subject|character)\/(\d+)/);
  if (!m) return '';
  return m[1];
}

export function genLinkText(url: string, text: string = '地址') {
  const $div = document.createElement('div');
  const $link = document.createElement('a');
  $link.href = url;
  $link.innerText = text;
  $div.appendChild($link);
  return $div.innerHTML;
}
