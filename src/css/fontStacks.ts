const platformSans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
const simplifiedChinese = '"PingFang SC", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC"';

export const UI_FONT_STACK = `${platformSans}, ${simplifiedChinese}, system-ui, sans-serif`;

export const JAPANESE_FONT_STACK = `${platformSans}, "Hiragino Sans", "Yu Gothic UI", Meiryo, "Noto Sans CJK JP", "Noto Sans JP", system-ui, sans-serif`;

export const MONOSPACE_FONT_STACK =
  `"Cascadia Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", ${simplifiedChinese}, ui-monospace, monospace`;
