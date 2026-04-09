import type { Page } from '@playwright/test';
import type { WikiPageContext } from '../../src/sites/core/context';

export type E2EWikiInfo = {
  name: string;
  value: unknown;
  category?: string;
};

type RuntimeKind = 'subject' | 'character';

type RuntimeWindow = Window & {
  __BNWH_E2E__?: {
    extractSubject: () => Promise<E2EWikiInfo[]>;
    extractCharacter: () => Promise<E2EWikiInfo[]>;
    registeredKinds: () => RuntimeKind[];
    reset: () => void;
    setPageContext: (pageContext: WikiPageContext) => void;
  };
};

type WikiRuntimeInjectOptions = {
  runtimeOrigin?: string;
  pageContext?: WikiPageContext;
  bypassCSP?: boolean;
};

const DEFAULT_RUNTIME_ORIGIN = 'http://127.0.0.1:4173';

function normalizeRuntimePath(pathname: string) {
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function resolveRuntimeUrl(
  runtimeModulePath: string,
  runtimeOrigin: string
): string {
  const runtimeUrl = new URL(
    normalizeRuntimePath(runtimeModulePath),
    runtimeOrigin
  );
  runtimeUrl.searchParams.set(
    'v',
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
  return runtimeUrl.href;
}

async function resetWikiRuntime(page: Page, pageContext: WikiPageContext) {
  await page.evaluate((context) => {
    const runtime = (window as RuntimeWindow).__BNWH_E2E__;
    if (!runtime) {
      return;
    }
    runtime.reset();
    runtime.setPageContext(context);
  }, pageContext);
}

async function injectWikiRuntime(
  page: Page,
  runtimeModulePath: string,
  requiredKind: RuntimeKind,
  options: WikiRuntimeInjectOptions = {}
) {
  const runtimeUrl = resolveRuntimeUrl(
    runtimeModulePath,
    options.runtimeOrigin ?? DEFAULT_RUNTIME_ORIGIN
  );

  await resetWikiRuntime(page, options.pageContext ?? {});
  await page.evaluate(async (modulePath) => {
    await import(modulePath);
  }, runtimeUrl);
  await page.waitForFunction(
    (requiredKind) =>
      Boolean(
        window.__BNWH_E2E__?.registeredKinds().includes(requiredKind)
      ),
    requiredKind
  );
}

async function ensureRegisteredKind(page: Page, kind: RuntimeKind) {
  const isRegistered = await page.evaluate((requiredKind) => {
    return Boolean(
      window.__BNWH_E2E__?.registeredKinds().includes(requiredKind)
    );
  }, kind);

  if (!isRegistered) {
    throw new Error(`BNWH E2E ${kind} runtime is not registered`);
  }
}

export async function extractSubject(
  page: Page,
  runtimeModulePath: string,
  options: WikiRuntimeInjectOptions = {}
) {
  await injectWikiRuntime(page, runtimeModulePath, 'subject', options);
  await ensureRegisteredKind(page, 'subject');
  return page.evaluate(async () => {
    const runtime = (window as RuntimeWindow).__BNWH_E2E__;
    if (!runtime) {
      throw new Error('BNWH E2E runtime is not available on window');
    }
    if (!runtime.registeredKinds().includes('subject')) {
      throw new Error('BNWH E2E subject runtime is not registered');
    }
    return runtime.extractSubject();
  });
}

export async function extractCharacter(
  page: Page,
  runtimeModulePath: string,
  options: WikiRuntimeInjectOptions = {}
) {
  await injectWikiRuntime(page, runtimeModulePath, 'character', options);
  await ensureRegisteredKind(page, 'character');
  return page.evaluate(async () => {
    const runtime = (window as RuntimeWindow).__BNWH_E2E__;
    if (!runtime) {
      throw new Error('BNWH E2E runtime is not available on window');
    }
    if (!runtime.registeredKinds().includes('character')) {
      throw new Error('BNWH E2E character runtime is not registered');
    }
    return runtime.extractCharacter();
  });
}
