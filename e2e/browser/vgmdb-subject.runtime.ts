import { createWikiExtractContext } from '../../src/sites/core/context';
import { getWikiData } from '../../src/sites/core/extract';
import { vgmdbSubject } from '../../src/sites/vgmdb/subject';
import { registerSubjectRuntime } from './wiki-runtime';

registerSubjectRuntime(() => {
  return getWikiData(
    vgmdbSubject,
    createWikiExtractContext(document, window.__BNWH_E2E__?.getPageContext())
  );
});
