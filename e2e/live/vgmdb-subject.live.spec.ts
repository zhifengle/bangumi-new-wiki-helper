import { expect, test } from '@playwright/test';
import { createRemoteWikiPageContext } from '../../src/sites/core/context';
import { extractSubject } from '../helpers/wikiExtract';
import { openLiveUrl } from '../helpers/wikiPage';

test('extracts key VGMdb fields from a live album page', async ({ page }) => {
  await openLiveUrl(page, 'https://vgmdb.net/album/9683');

  await expect(page.locator('#innermain > h1')).toHaveText(/\S/);

  const infos = await extractSubject(page, '/e2e/browser/vgmdb-subject.runtime.ts', {
    pageContext: createRemoteWikiPageContext(page.url()),
  });

  expect(infos).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: '唱片名',
        category: 'subject_title',
        value: expect.any(String),
      }),
      expect.objectContaining({
        name: '发售日期',
        value: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
      expect.objectContaining({
        name: '厂牌',
        value: expect.any(String),
      }),
    ])
  );
});
