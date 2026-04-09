import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

const { use: baseUse, testDir: _testDir, testIgnore: _testIgnore, ...sharedConfig } =
  baseConfig;

export default defineConfig({
  ...sharedConfig,
  testDir: './e2e/live',
  testIgnore: [],
  use: {
    ...baseUse,
    bypassCSP: true,
  },
});
