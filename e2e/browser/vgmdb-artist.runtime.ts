import { createWikiExtractContext } from '../../src/sites/core/context';
import { getPersonData } from '../../src/sites/core/extract';
import { vgmdbArtist } from '../../src/sites/vgmdb/artist';
import { registerPersonRuntime } from './wiki-runtime';

registerPersonRuntime(() => {
  return getPersonData(
    vgmdbArtist,
    createWikiExtractContext(document, window.__BNWH_E2E__?.getPageContext())
  );
});
