export function getSteamdbURL(href: string) {
  href = href || location?.href;
  const id = href.match(/store\.steampowered\.com\/app\/(\d+)\/?/)?.[1];
  if (id) {
    return `https://steamdb.info/app/${id}/info/`;
  }
  return '';
}

export function getSteamURL(href: string) {
  href = href || location?.href;
  const id = href.match(/steamdb\.info\/app\/(\d+)\/?/)?.[1];
  if (id) {
    return `https://store.steampowered.com/app/${id}/_/`;
  }
  return '';
}
