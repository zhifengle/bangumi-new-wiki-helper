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
    text: jest.fn().mockResolvedValue(''),
    json: jest.fn().mockResolvedValue({}),
    blob: jest.fn().mockResolvedValue(new Blob()),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
    ...overrides,
  } as unknown as Response;
}

import { fetchBinary, fetchJson, fetchText } from './fetchData';

describe('fetchData helpers', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('fetchText decodes arraybuffer responses when decode is provided', async () => {
    const text = 'テスト内容';
    const buffer = new TextEncoder().encode(text).buffer;
    const fetchMock = jest.fn().mockResolvedValue(
      createResponse({
        arrayBuffer: jest.fn().mockResolvedValue(buffer),
      })
    ) as jest.MockedFunction<typeof fetch>;
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
    globalThis.fetch = jest.fn().mockResolvedValue(
      createResponse({
        json: jest.fn().mockResolvedValue(payload),
      })
    ) as jest.MockedFunction<typeof fetch>;

    const result = await fetchJson<{ id: number; name: string }>(
      'https://example.com/api'
    );

    expect(result).toEqual(payload);
  });

  test('fetchBinary forwards POST data as request body', async () => {
    const blob = new Blob(['cover'], { type: 'image/png' });
    const fetchMock = jest.fn().mockResolvedValue(
      createResponse({
        blob: jest.fn().mockResolvedValue(blob),
      })
    ) as jest.MockedFunction<typeof fetch>;
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
    jest.useFakeTimers();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    globalThis.fetch = jest.fn().mockImplementation(
      () => new Promise(() => undefined)
    ) as jest.MockedFunction<typeof fetch>;

    const pending = fetchText('https://example.com/slow', {}, 10);
    const rejection = expect(pending).rejects.toThrow('fetch timeout');
    await jest.advanceTimersByTimeAsync(10);

    await rejection;
    expect(logSpy).toHaveBeenCalled();
  });
});
