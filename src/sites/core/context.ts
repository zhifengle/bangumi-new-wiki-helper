export type WikiPageContext = {
  sourceUrl?: string;
  imageReferer?: string;
};

export function createRemoteWikiPageContext(url: string): WikiPageContext {
  return {
    sourceUrl: url,
    imageReferer: url,
  };
}
