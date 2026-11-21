import { UI_FONT_STACK } from '../css/fontStacks';
import type {
  SubjectCandidateChoice,
  SubjectCandidatePrompt,
} from '../interface/subjectCreation';
import type { SearchResult } from '../interface/subjectInfo';
import { htmlToElement } from '../utils/dom/html';

let activeDialog: HTMLDialogElement | undefined;

function renderCandidate(candidate: SearchResult) {
  const row = htmlToElement<HTMLLIElement>(`
    <li>
      <button type="submit" class="candidate">
        <span class="candidate-name"></span>
        <span class="candidate-alias"></span>
        <span class="candidate-details"></span>
        <span class="candidate-action">打开 <span aria-hidden="true">↗</span></span>
      </button>
    </li>
  `);
  const button = row.querySelector('button')!;
  button.value = candidate.url;
  row.querySelector('.candidate-name')!.textContent = candidate.name;
  const alias = row.querySelector<HTMLElement>('.candidate-alias')!;
  const alternateName = candidate.greyName?.trim();
  alias.hidden = !alternateName || alternateName === candidate.name.trim();
  alias.textContent = alternateName ?? '';
  const credit = candidate.personCredit;
  row.querySelector('.candidate-details')!.textContent = [
    candidate.releaseDate,
    `#${candidate.url.split('/').pop()}`,
    credit && `通过 ${credit.name} 的作品找到${credit.staff ? `（${credit.staff}）` : ''}`,
  ].filter(Boolean).join(' · ');
  return row;
}

export function chooseSubjectCandidate({
  name,
  candidates,
}: SubjectCandidatePrompt): Promise<SubjectCandidateChoice> {
  activeDialog?.close();
  const host = document.createElement('div');
  host.style.display = 'contents';
  const shadow = host.attachShadow({ mode: 'open' });
  const dialog = htmlToElement<HTMLDialogElement>(`
<dialog lang="zh-Hans" aria-labelledby="title" aria-describedby="source-title">
  <style>
    * { box-sizing: border-box; }
    dialog {
      --surface: #fff;
      --subtle: #f6f7f9;
      --text: #20242d;
      --muted: #555e6e;
      --line: #d6dbe3;
      --accent: #9b285a;
      --hover: #fff3f8;
      color-scheme: light;
      inline-size: min(580px, calc(100% - 24px));
      max-block-size: calc(100dvh - 24px);
      margin: auto;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--surface);
      color: var(--text);
      padding: 0;
      box-shadow: 0 16px 48px #0003;
      font: 14px/1.55 ${UI_FONT_STACK};
    }
    @media (prefers-color-scheme: dark) {
      dialog {
        color-scheme: dark;
        --surface: #1b2028;
        --subtle: #242a34;
        --text: #eff1f6;
        --muted: #b5becd;
        --line: #485261;
        --accent: #ffb4d2;
        --hover: #362735;
      }
    }
    dialog::backdrop { background: #161b2580; }
    form {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      max-block-size: min(680px, calc(100dvh - 26px));
      margin: 0;
    }
    h2, h3, p, ul { margin: 0; }
    header, .results { padding: 16px 20px; }
    h2 { font-size: 18px; line-height: 1.3; }
    h2:focus { outline: none; }
    .source {
      margin-top: 12px;
      padding: 8px 12px;
      background: var(--subtle);
      border-radius: 8px;
    }
    .source-label, .candidate-details { color: var(--muted); font-size: 12px; }
    #source-title {
      overflow-wrap: anywhere;
      max-block-size: 5.8em;
      overflow: auto;
      margin-top: 3px;
    }
    .results { overflow-y: auto; padding-top: 0; }
    h3 { margin-bottom: 8px; font-size: 13px; font-weight: 600; }
    ul { display: grid; gap: 8px; padding: 0; list-style: none; }
    button {
      appearance: none;
      min-block-size: 40px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font: inherit;
      cursor: pointer;
    }
    button:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: -3px;
    }
    .candidate {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: 12px;
      row-gap: 3px;
      align-items: center;
      inline-size: 100%;
      padding: 10px 12px;
      text-align: start;
      overflow-wrap: anywhere;
    }
    .candidate:hover { border-color: var(--accent); background: var(--hover); }
    .candidate-name { font-weight: 600; }
    .candidate-alias { color: var(--muted); font-size: 13px; }
    .candidate-name, .candidate-alias, .candidate-details { grid-column: 1; }
    .candidate-action {
      grid-column: 2;
      grid-row: 1 / span 3;
      color: var(--accent);
      font-size: 13px;
      white-space: nowrap;
    }
    footer {
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 20px;
      border-top: 1px solid var(--line);
    }
    footer button { padding: 6px 12px; }
    footer button:hover { background: var(--subtle); }
    .cancel { border-color: transparent; color: var(--muted); }
    [hidden] { display: none; }
  </style>
  <form method="dialog">
    <header>
      <h2 id="title" tabindex="-1" autofocus>Bangumi 查重</h2>
      <div class="source">
        <p class="source-label">待查条目</p>
        <p id="source-title"></p>
      </div>
    </header>
    <section class="results" aria-labelledby="results-heading">
      <h3 id="results-heading"></h3>
      <ul></ul>
    </section>
    <footer>
      <button type="submit" class="cancel" value="cancel">取消</button>
      <button type="submit" value="create">没有匹配，继续新建</button>
    </footer>
  </form>
</dialog>
`);
  dialog.querySelector('#source-title')!.textContent = name;
  dialog.querySelector('#results-heading')!.textContent = `候选条目（${candidates.length}）`;
  dialog.querySelector('ul')!.append(...candidates.map(renderCandidate));
  shadow.appendChild(dialog);
  document.body.appendChild(host);
  activeDialog = dialog;
  const choice = new Promise<SubjectCandidateChoice>((resolve) => {
    dialog.addEventListener('close', () => {
      const value = dialog.returnValue;
      if (activeDialog === dialog) activeDialog = undefined;
      host.remove();
      if (value === 'create') resolve({ kind: 'create' });
      else if (candidates.some(({ url }) => url === value)) {
        resolve({ kind: 'open', url: value });
      } else {
        resolve(null);
      }
    }, { once: true });
  });
  dialog.showModal();
  return choice;
}
