type FuseSearchResult<T> = {
  item: T;
};

declare const Fuse: {
  new <T>(
    list: readonly T[],
    options?: Record<string, unknown>
  ): {
    search(pattern: string): FuseSearchResult<T>[];
  };
};
// Jest fixtures still use CommonJS require in test files.
declare const require: NodeJS.Require;

declare function GM_setValue(key: string, value: unknown): void;
declare function GM_getValue<T = unknown>(key: string): T | undefined;
declare function GM_registerMenuCommand(
  caption: string,
  onClick: () => void,
  accessKey?: string
): void;
declare function GM_addStyle(css: string): HTMLStyleElement | void;
declare function GM_openInTab(url: string): void;
declare function GM_getResourceText(name: string): string;
declare function GM_deleteValue(key: string): void;
