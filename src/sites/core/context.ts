export type WikiPageContext = {
  sourceUrl?: string;
};

// extract 阶段显式传入的查询根节点。
export type WikiExtractRoot = Document | Element;

export type WikiExtractContext = WikiPageContext & {
  // 当前字段抽取所使用的 DOM 查询范围。
  root?: WikiExtractRoot;
};

export function createWikiExtractContext(
  root?: WikiExtractRoot,
  pageContext: WikiPageContext = {}
): WikiExtractContext {
  return root
    ? {
        ...pageContext,
        root,
      }
    : { ...pageContext };
}

export function createRemoteWikiPageContext(url: string): WikiPageContext {
  return {
    sourceUrl: url,
  };
}
