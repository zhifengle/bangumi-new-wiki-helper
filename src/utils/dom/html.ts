/**
 * @param {String} HTML 字符串
 * @return {Element}
 */
export function htmlToElement<E extends Element = Element>(html: string): E {
  const template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  const firstElement = template.content.firstElementChild;
  if (!firstElement) {
    throw new Error('htmlToElement requires a root element');
  }
  return firstElement as E;
}

export function genAnonymousLinkText(url: string, text: string): string {
  return `<a
      target="_blank"
      href="${url}"
      rel="noopener noreferrer nofollow">
      ${text}</a>
    `;
}

export function addHTMLBase(html: string, url: string): string {
  if (html.match(/<base.+>/)) {
    return html;
  }
  const obj = new URL(url);
  return html.replace('</head>', `<base href="${obj.origin}"></head>`);
}
