import { SingleInfo } from '../../interface/subjectInfo';
import { PersonRole } from '../../interface/wiki';
import { PersonTools } from '../catalogTypes';
import { WikiExtractRoot } from '../core/context';

const MONTHS: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

// VGMdb 只给出已知的部分（可能缺年或缺月日），按 Bangumi 惯用的 年月日 写法输出
export function formatBangumiBirthday(raw: string): string {
  const text = raw.trim();
  let m = text.match(/^([A-Z][a-z]{2})[a-z]*\s+(\d{1,2}),\s*(\d{4})$/);
  if (m && MONTHS[m[1]]) {
    return `${m[3]}年${MONTHS[m[1]]}月${Number(m[2])}日`;
  }
  m = text.match(/^([A-Z][a-z]{2})[a-z]*\s+(\d{4})$/);
  if (m && MONTHS[m[1]]) {
    return `${m[2]}年${MONTHS[m[1]]}月`;
  }
  m = text.match(/^([A-Z][a-z]{2})[a-z]*\s+(\d{1,2})$/);
  if (m && MONTHS[m[1]]) {
    return `${MONTHS[m[1]]}月${Number(m[2])}日`;
  }
  m = text.match(/^(\d{4})$/);
  if (m) {
    return `${m[1]}年`;
  }
  m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
  }
  return text;
}

// "折戸 伸治 (おりと しんじ)" → 姓名去空格，假名原样
export function parseJapaneseName(raw: string): { name: string; kana: string } {
  const text = raw.replace(/ /g, ' ').trim();
  if (!text) {
    return { name: '', kana: '' };
  }
  const m = text.match(/^(.+?)\s*[（(]\s*(.+?)\s*[)）]\s*$/);
  const name = (m ? m[1] : text).replace(/\s+/g, '');
  const kana = m ? m[2].trim() : '';
  return { name, kana };
}

// Bangumi 的罗马字是姓在前；VGMdb 显示名是名在前，两个词时对调
export function toBangumiRomaji(displayName: string, hasJapaneseName: boolean): string {
  const text = displayName.trim();
  const parts = text.split(/\s+/);
  if (hasJapaneseName && parts.length === 2) {
    return `${parts[1]} ${parts[0]}`;
  }
  return text;
}

// person/new 的人物类型：同人社团、乐队组合算「组合」，其余按「公司」
export function resolveOrgRole(type: string): PersonRole {
  if (/doujin|circle|unit|group|band/i.test(type)) {
    return 3;
  }
  return 2;
}

// VGMdb 外链形如 /redirect/<n>/<目标地址>，目标地址可能不带协议
export function cleanRedirectUrl(href: string): string {
  let url = href.replace(
    /^(?:https?:\/\/(?:www\.)?vgmdb\.net)?\/redirect\/\d+\//,
    ''
  );
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

function cleanText(text: string | null | undefined): string {
  return (text ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
}

function isHidden(el: Element): boolean {
  const style = el.getAttribute('style') ?? '';
  return /display\s*:\s*none/i.test(style);
}

// 链接文字优先取可见的英文名 span，避免把隐藏的日文变体一起带出来
function readLabel(el: Element): string {
  const visible = el.querySelector('span[lang="en"]');
  return cleanText((visible ?? el).textContent);
}

// 读取 <b>标签</b><br>值 这类信息行里的所有值：按 <br> 切分文本，链接与子块各算一条
function readRowValues(row: Element): string[] {
  const values: string[] = [];
  let buffer = '';
  const flush = () => {
    const value = cleanText(buffer);
    if (value) values.push(value);
    buffer = '';
  };
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      buffer += node.textContent ?? '';
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName;
    if (tag === 'B' || tag === 'IMG' || tag === 'EM' || isHidden(el)) return;
    if (tag === 'BR') {
      flush();
      return;
    }
    if (tag === 'A' || tag === 'DIV') {
      flush();
      const label = readLabel(el);
      if (label) values.push(label);
      return;
    }
    el.childNodes.forEach(walk);
  };
  row.childNodes.forEach(walk);
  flush();
  return values;
}

function findRow(root: ParentNode, label: string): Element | undefined {
  return Array.from(root.querySelectorAll('#leftfloat > div')).find((div) => {
    const b = div.querySelector('b');
    return !!b && b.parentElement === div && cleanText(b.textContent) === label;
  });
}

function textWithLineBreaks(el: Element): string {
  let out = '';
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      out += node.textContent ?? '';
      return;
    }
    if (node.nodeType !== 1) return;
    const child = node as Element;
    if (isHidden(child)) return;
    if (child.tagName === 'BR') {
      out += '\n';
      return;
    }
    child.childNodes.forEach(walk);
  };
  el.childNodes.forEach(walk);
  return out.replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').trim();
}

function readNotes(root: ParentNode): string {
  const heading = Array.from(root.querySelectorAll('#rightfloat h3')).find(
    (h3) => cleanText(h3.textContent) === 'Notes'
  );
  const body = heading?.parentElement?.nextElementSibling?.querySelector(
    '.smallfont'
  );
  if (!body) return '';
  const text = textWithLineBreaks(body);
  if (/^No notes available/i.test(text)) return '';
  return text;
}

const LINK_GROUPS_KEPT = new Set(['Official', 'Personal']);

// Official 组第一条进官方网站，其余 Official 与 Personal 进链接块；X 统一写成 [X|url]
function collectLinkInfos(root: ParentNode): SingleInfo[] {
  const res: SingleInfo[] = [];
  let officialDone = false;
  for (const label of Array.from(root.querySelectorAll('b.label'))) {
    const group = cleanText(label.textContent);
    if (!LINK_GROUPS_KEPT.has(group)) continue;
    const container = label.parentElement;
    if (!container) continue;
    for (const anchor of Array.from(
      container.querySelectorAll('span.link_doc a[rel="nofollow"]')
    )) {
      const href = anchor.getAttribute('href');
      if (!href) continue;
      const url = cleanRedirectUrl(href);
      if (/web\.archive\.org/i.test(url)) continue;
      const text = cleanText(anchor.textContent);
      if (/^https?:\/\/(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\//i.test(url)) {
        res.push({ name: '链接', value: `X|${url}`, category: 'listItem' });
        continue;
      }
      if (group === 'Official' && !officialDone) {
        officialDone = true;
        res.push({ name: '官方网站', value: url });
        continue;
      }
      res.push({
        name: '链接',
        value: `${text || url}|${url}`,
        category: 'listItem',
      });
    }
  }
  return res;
}

function collectArtistInfos(root: ParentNode): SingleInfo[] {
  const res: SingleInfo[] = [];
  const displayName = cleanText(
    root.querySelector('#innermain > span[style*="1.5em"]')?.textContent
  );
  const jp = parseJapaneseName(
    root.querySelector('#leftfloat > span[style*="9pt"]')?.textContent ?? ''
  );
  if (jp.name) {
    res.push({ name: '姓名', value: jp.name, category: 'crt_name' });
    res.push({ name: '日文名', value: jp.name });
    if (displayName && displayName !== jp.name) {
      res.push({ name: '罗马字', value: toBangumiRomaji(displayName, true) });
    }
  } else if (displayName) {
    res.push({ name: '姓名', value: displayName, category: 'crt_name' });
  }
  if (jp.kana) {
    res.push({ name: '纯假名', value: jp.kana });
  }

  const genderIcon = root.querySelector('#leftfloat img.inlineimg[title]');
  const gender = cleanText(genderIcon?.getAttribute('title'));
  if (/^male$/i.test(gender)) {
    res.push({ name: '性别', value: '男' });
  } else if (/^female$/i.test(gender)) {
    res.push({ name: '性别', value: '女' });
  }

  for (const label of ['Aliases', 'Variations']) {
    const row = findRow(root, label);
    if (!row) continue;
    for (const value of readRowValues(row)) {
      res.push({ name: '别名', value, category: 'listItem' });
    }
  }

  const orgRow = findRow(root, 'Organizations');
  if (orgRow) {
    for (const value of readRowValues(orgRow)) {
      res.push({ name: '所属公司', value, category: 'listItem' });
    }
  }

  const notes = readNotes(root);
  if (notes) {
    res.push({ name: '人物简介', value: notes, category: 'crt_summary' });
  }

  res.push(...collectLinkInfos(root));
  return res;
}

function readOrgType(root: ParentNode): string {
  const dt = Array.from(root.querySelectorAll('dl dt.label')).find(
    (item) => cleanText(item.textContent) === 'Type'
  );
  return cleanText(dt?.nextElementSibling?.textContent);
}

function collectOrgInfos(root: ParentNode): SingleInfo[] {
  const res: SingleInfo[] = [];
  const name = cleanText(
    root.querySelector('h1[style*="display: inline"]')?.textContent
  );
  if (name) {
    res.push({ name: '姓名', value: name, category: 'crt_name' });
  }
  res.push({
    name: 'crt_role',
    value: String(resolveOrgRole(readOrgType(root))),
    category: 'select',
  });
  res.push(...collectLinkInfos(root));
  return res;
}

function resolveRoot(root?: WikiExtractRoot): ParentNode {
  return root ?? document;
}

export const vgmdbArtistTools: PersonTools = {
  hooks: {
    async afterGetWikiData(infos: SingleInfo[], _model, root) {
      return [...collectArtistInfos(resolveRoot(root)), ...infos];
    },
  },
  filters: [{ category: 'date', dealFunc: formatBangumiBirthday }],
};

export const vgmdbOrgTools: PersonTools = {
  hooks: {
    async afterGetWikiData(infos: SingleInfo[], _model, root) {
      return [...collectOrgInfos(resolveRoot(root)), ...infos];
    },
  },
  filters: [{ category: 'date', dealFunc: formatBangumiBirthday }],
};
