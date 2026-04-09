import type { Page } from '@playwright/test';

function normalizePath(pathname: string) {
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export async function openFixture(page: Page, fixturePath: string) {
  await page.goto(normalizePath(fixturePath), {
    waitUntil: 'domcontentloaded',
  });
}

export async function openLiveUrl(page: Page, url: string) {
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
  });
}
