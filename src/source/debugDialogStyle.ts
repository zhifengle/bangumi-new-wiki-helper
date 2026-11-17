import { JAPANESE_FONT_STACK, MONOSPACE_FONT_STACK, UI_FONT_STACK } from '../css/fontStacks';

// Kept inline in the dialog's shadow root for both browser builds.
export const debugDialogStyle = `
  :host { all: initial !important; display: contents !important; }
  [hidden] { display: none !important; }
  *, *::before, *::after { box-sizing: border-box; }

  .e-bnwh-debug-dialog {
    --ink: #172235;
    --muted: #526278;
    --line: #dce4ee;
    --surface: #f5f7fb;
    --accent: #174db5;
    --accent-bg: #ebf2ff;
    --gutter: 24px;
    --mono: ${MONOSPACE_FONT_STACK};
    width: min(940px, calc(100vw - 32px));
    max-width: none;
    max-height: calc(100vh - 32px);
    max-height: calc(100dvh - 32px);
    margin: auto;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: 0 24px 72px rgb(12 25 47 / 24%);
    background: #fff;
    color: var(--ink);
    color-scheme: light;
    font: 14px/1.55 ${UI_FONT_STACK};
    text-align: start;
  }
  .e-bnwh-debug-dialog::backdrop { background: rgb(16 29 50 / 50%); }
  .e-bnwh-debug-shell {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto minmax(128px, 1fr) auto;
    height: min(740px, calc(100vh - 34px));
    height: min(740px, calc(100dvh - 34px));
  }
  .e-bnwh-debug-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 18px var(--gutter) 14px;
  }
  .e-bnwh-debug-heading { min-width: 0; }
  .e-bnwh-debug-title { margin: 0; font-size: 20px; font-weight: 700; line-height: 1.35; }
  .e-bnwh-debug-title:focus { outline: none; }
  .e-bnwh-debug-context {
    margin: 4px 0 0;
    overflow: hidden;
    color: var(--muted);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .e-bnwh-debug-close-icon {
    flex: none;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fff;
    color: var(--muted);
    font: inherit;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }
  .e-bnwh-debug-close-icon:hover { background: var(--surface); color: var(--ink); }

  .e-bnwh-debug-findings {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 18px;
    row-gap: 6px;
    margin: 0;
    padding: 9px var(--gutter);
    border-block: 1px solid var(--line);
    background: var(--surface);
  }
  .e-bnwh-debug-findings-title {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
  }
  .e-bnwh-debug-findings-title::before {
    content: "";
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
  .e-bnwh-debug-findings[data-level="ok"] .e-bnwh-debug-findings-title { color: #166746; }
  .e-bnwh-debug-findings[data-level="warning"] .e-bnwh-debug-findings-title { color: #8a4506; }
  .e-bnwh-debug-findings[data-level="error"] .e-bnwh-debug-findings-title { color: #a52231; }
  .e-bnwh-debug-summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 3px 16px;
    margin: 0 0 0 auto;
    font-size: 12px;
  }
  .e-bnwh-debug-summary > div { display: flex; align-items: baseline; gap: 5px; min-width: 0; }
  .e-bnwh-debug-summary dt { color: var(--muted); white-space: nowrap; }
  .e-bnwh-debug-summary dd {
    margin: 0;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .e-bnwh-debug-summary .e-bnwh-debug-site { font-family: var(--mono); }
  .e-bnwh-debug-issues {
    flex-basis: 100%;
    max-height: 68px;
    margin: 0;
    padding-inline-start: 23px;
    overflow: auto;
    color: var(--muted);
    font-size: 12px;
    overflow-wrap: anywhere;
  }

  .e-bnwh-debug-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    padding-inline: var(--gutter);
    border-bottom: 1px solid var(--line);
  }
  .e-bnwh-debug-tabs { display: flex; min-width: 0; gap: 14px; }
  .e-bnwh-debug-tab {
    position: relative;
    padding: 11px 4px;
    border: 0;
    background: transparent;
    color: var(--muted);
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    cursor: pointer;
  }
  .e-bnwh-debug-tab:hover { color: var(--ink); }
  .e-bnwh-debug-tab[aria-selected="true"] { color: var(--accent); font-weight: 700; }
  .e-bnwh-debug-tab[aria-selected="true"]::after {
    content: "";
    position: absolute;
    inset: auto 0 -1px;
    height: 2px;
    border-radius: 2px;
    background: var(--accent);
  }
  .e-bnwh-debug-source-wrap { min-width: 0; margin-left: auto; padding-block: 4px; }
  .e-bnwh-debug-source {
    width: auto;
    max-width: min(250px, 100%);
    min-height: 32px;
    padding: 4px 8px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 13px;
  }

  .e-bnwh-debug-panel { min-width: 0; min-height: 0; padding: 14px var(--gutter); overflow: auto; }
  .e-bnwh-debug-panel[data-panel="fields"] {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 10px;
    overflow: hidden;
  }
  .e-bnwh-debug-filter { display: flex; align-items: center; gap: 10px; }
  .e-bnwh-debug-search {
    flex: 1;
    min-width: 0;
    max-width: 360px;
    height: 34px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 14px;
  }
  .e-bnwh-debug-search::placeholder { color: var(--muted); opacity: 1; }
  .e-bnwh-debug-results {
    margin-left: auto;
    color: var(--muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .e-bnwh-debug-table-scroll {
    overflow: auto;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: #fff;
  }
  .e-bnwh-debug-table { width: 100%; border-spacing: 0; table-layout: fixed; }
  .e-bnwh-debug-table th {
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 8px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--surface);
    color: var(--muted);
    text-align: start;
    font-size: 13px;
    font-weight: 600;
  }
  .e-bnwh-debug-table td {
    padding: 9px 10px;
    border-bottom: 1px solid #edf1f6;
    vertical-align: top;
    overflow-wrap: anywhere;
  }
  .e-bnwh-debug-table tr:nth-child(even) { background: #fafbfd; }
  .e-bnwh-debug-table tr.is-problem { background: #fff7ed; }
  .e-bnwh-debug-table tr:last-child td { border-bottom: 0; }
  .e-bnwh-debug-table th:nth-child(1) { width: 44px; }
  .e-bnwh-debug-table th:nth-child(2) { width: 19%; }
  .e-bnwh-debug-table th:nth-child(3) { width: 18%; }
  .e-bnwh-debug-table td:first-child {
    color: var(--muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .e-bnwh-debug-table td:nth-child(2) { font-weight: 600; }
  .e-bnwh-debug-table td:nth-child(3) { color: var(--muted); font: 13px/1.55 var(--mono); }
  .e-bnwh-debug-table td:last-child { line-height: 1.65; white-space: pre-wrap; }
  .e-bnwh-debug-table td:last-child:lang(ja) { font-family: ${JAPANESE_FONT_STACK}; }
  .e-bnwh-debug-mobile-category { display: none; }
  .e-bnwh-debug-empty { margin: 0; padding: 24px 12px; color: var(--muted); text-align: center; }

  .e-bnwh-debug-selector-note { margin: 0 0 10px; color: var(--muted); font-size: 12px; }
  .e-bnwh-debug-selector-list { border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
  .e-bnwh-debug-selector-list details + details { border-top: 1px solid var(--line); }
  .e-bnwh-debug-selector-list summary {
    padding: 9px 12px;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .e-bnwh-debug-selector-list summary:hover,
  .e-bnwh-debug-selector-list details[open] summary { background: var(--surface); }
  .e-bnwh-debug-selector-status { color: var(--muted); font-weight: 600; }
  [data-result="matched"] .e-bnwh-debug-selector-status { color: #166746; }
  [data-result="empty"] .e-bnwh-debug-selector-status { color: #8a4506; }
  [data-result="error"] .e-bnwh-debug-selector-status { color: #a52231; }
  .e-bnwh-debug-selector-list pre {
    margin: 0;
    padding: 10px 14px;
    border-top: 1px solid var(--line);
    background: #fafbfd;
    font: 13px/1.6 var(--mono);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .e-bnwh-debug-panel[data-panel="json"] { display: flex; overflow: hidden; }
  .e-bnwh-debug-json {
    width: 100%;
    min-height: 0;
    padding: 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    font: 13px/1.65 var(--mono);
    resize: none;
  }

  .e-bnwh-debug-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 6px 8px;
    padding: 10px var(--gutter);
    border-top: 1px solid var(--line);
    background: var(--surface);
  }
  .e-bnwh-debug-privacy { margin: 0 auto 0 0; color: var(--muted); font-size: 12px; }
  .e-bnwh-debug-button {
    min-height: 34px;
    padding: 4px 11px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
  }
  .e-bnwh-debug-button:hover { border-color: #a7b6ce; background: var(--accent-bg); }
  .e-bnwh-debug-button-primary { border-color: var(--accent); background: var(--accent); color: #fff; }
  .e-bnwh-debug-button-primary:hover { border-color: #123b88; background: #123b88; }
  :is(button, input, select, textarea, summary, [tabindex="0"]):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .e-bnwh-debug-selector-list summary:focus-visible { outline-offset: -2px; }

  @media (max-width: 620px) {
    .e-bnwh-debug-dialog {
      --gutter: 12px;
      width: calc(100vw - 16px);
      max-height: calc(100vh - 16px);
      max-height: calc(100dvh - 16px);
    }
    .e-bnwh-debug-shell {
      height: min(740px, calc(100vh - 18px));
      height: min(740px, calc(100dvh - 18px));
    }
    .e-bnwh-debug-header { padding-block: 14px 10px; }
    .e-bnwh-debug-title { font-size: 18px; }
    .e-bnwh-debug-summary { margin-left: 0; gap: 3px 12px; }
    .e-bnwh-debug-tabs { gap: 10px; }
    .e-bnwh-debug-source-wrap { margin-left: 0; }
    .e-bnwh-debug-table :is(th, td) { padding: 7px 5px; }
    .e-bnwh-debug-table th:nth-child(1) { width: 29px; }
    .e-bnwh-debug-table th:nth-child(2) { width: 29%; }
    .e-bnwh-debug-table :is(th, td):nth-child(3) { display: none; }
    .e-bnwh-debug-mobile-category {
      display: block;
      margin-top: 2px;
      color: var(--muted);
      font: 12px/1.45 var(--mono);
    }
    .e-bnwh-debug-privacy { flex-basis: 100%; }
    .e-bnwh-debug-footer { justify-content: flex-start; }
    .e-bnwh-debug-button { flex: 1 0 auto; }
  }

  @media (max-width: 620px) and (max-height: 650px) {
    .e-bnwh-debug-header { padding-block: 10px 8px; }
    .e-bnwh-debug-findings { padding-block: 6px; row-gap: 3px; }
    .e-bnwh-debug-issues { max-height: 40px; }
    .e-bnwh-debug-toolbar { row-gap: 2px; }
    .e-bnwh-debug-tab { padding-block: 8px; }
    .e-bnwh-debug-panel { padding-block: 9px; }
    .e-bnwh-debug-panel[data-panel="fields"] { gap: 7px; }
    .e-bnwh-debug-footer { padding-block: 7px; }
  }
`;
