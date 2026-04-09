import { vi, type MockedFunction } from 'vitest';

const originalFetch = globalThis.fetch;

type MockResponseShape = Pick<
  Response,
  'ok' | 'text' | 'json' | 'blob' | 'arrayBuffer'
>;

function createResponse(
  overrides: Partial<MockResponseShape> = {}
): Response {
  return {
    ok: true,
    text: vi.fn().mockResolvedValue(''),
    json: vi.fn().mockResolvedValue({}),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    ...overrides,
  } as unknown as Response;
}

import { fetchBinary, fetchJson, fetchText } from './fetchData';

describe('fetchData helpers', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('fetchText decodes arraybuffer responses when decode is provided', async () => {
    const text = 'テスト内容';
    const buffer = new TextEncoder().encode(text).buffer;
    const fetchMock = vi.fn().mockResolvedValue(
      createResponse({
        arrayBuffer: vi.fn().mockResolvedValue(buffer),
      })
    ) as MockedFunction<typeof fetch>;
    globalThis.fetch = fetchMock;

    await expect(fetchText('https://example.com/page', { decode: 'utf-8' })).resolves.toBe(
      text
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/page',
      expect.objectContaining({
        method: 'GET',
        body: null,
      })
    );
  });

  test('fetchJson returns parsed json payloads', async () => {
    const payload = { id: 42, name: 'entry' };
    globalThis.fetch = vi.fn().mockResolvedValue(
      createResponse({
        json: vi.fn().mockResolvedValue(payload),
      })
    ) as MockedFunction<typeof fetch>;

    const result = await fetchJson<{ id: number; name: string }>(
      'https://example.com/api'
    );

    expect(result).toEqual(payload);
  });

  test('fetchBinary forwards POST data as request body', async () => {
    const blob = new Blob(['cover'], { type: 'image/png' });
    const fetchMock = vi.fn().mockResolvedValue(
      createResponse({
        blob: vi.fn().mockResolvedValue(blob),
      })
    ) as MockedFunction<typeof fetch>;
    globalThis.fetch = fetchMock;

    await expect(
      fetchBinary('https://example.com/upload', {
        method: 'post',
        data: 'payload',
      })
    ).resolves.toBe(blob);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/upload',
      expect.objectContaining({
        method: 'POST',
        body: 'payload',
      })
    );
  });

  test('fetchText rejects when the request times out', async () => {
    vi.useFakeTimers();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    globalThis.fetch = vi.fn().mockImplementation(
      () => new Promise(() => undefined)
    ) as MockedFunction<typeof fetch>;

    const pending = fetchText('https://example.com/slow', {}, 10);
    const rejection = expect(pending).rejects.toThrow('fetch timeout');
    await vi.advanceTimersByTimeAsync(10);

    await rejection;
    expect(logSpy).toHaveBeenCalled();
  });
});
