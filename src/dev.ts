import { fetchText } from './utils/fetchData';

async function test() {
  const text = await fetchText(location.href, { decode: 'EUC-JP' });
  console.log(text);
}
test();
