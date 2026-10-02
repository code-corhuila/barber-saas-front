import { describe, expect, it } from 'vitest';
import { SessionStore } from '../session/session-store';
import { ApiClient } from './api-client';

function storeWithToken(token: string | null) {
  const store = new SessionStore(undefined, () => 0);
  if (token) {
    store.signIn({ accessToken: token, refreshToken: 'r', expiresIn: 3600,
      user: { id: 'u', fullName: 'U', email: 'u@example.com', phone: null, profilePhotoUrl: null,
        role: 'CLIENT', barbershopId: null, isActive: true } });
  }
  return store;
}

function fakeFetch(status: number, body: unknown, seen: { url?: string; init?: RequestInit }) {
  return (async (url: string, init?: RequestInit) => {
    seen.url = url;
    seen.init = init;
    return new Response(body === undefined ? '' : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
}

describe('ApiClient', () => {
  it('sends the request to the gateway with the token, a correlation id and the idempotency key', async () => {
    const seen: { url?: string; init?: RequestInit } = {};
    const api = new ApiClient(storeWithToken('tok'), () => 'http://gw', fakeFetch(201, { id: '1' }, seen));

    const result = await api.post<{ id: string }>('/api/v1/appointments', { a: 1 }, { idempotencyKey: 'key-12345678' });

    const headers = seen.init?.headers as Record<string, string>;
    expect(result.id).toBe('1');
    expect(seen.url).toBe('http://gw/api/v1/appointments');
    expect(headers['Authorization']).toBe('Bearer tok');
    expect(headers['Idempotency-Key']).toBe('key-12345678');
    expect(headers['X-Correlation-Id']).toMatch(/[0-9a-f-]{36}/);
  });

  it('turns an error into an ApiError with the message already decided', async () => {
    const api = new ApiClient(storeWithToken(null), () => 'http://gw',
      fakeFetch(422, { error: 'BUSINESS_RULE_VIOLATION', message: 'The email is already registered', traceId: 't' }, {}));

    await expect(api.post('/api/v1/auth/register', {})).rejects.toMatchObject({
      status: 422, code: 'BUSINESS_RULE_VIOLATION', userMessage: 'Ese correo ya está registrado.',
    });
  });

  it('closes the session when the gateway answers 401', async () => {
    const store = storeWithToken('tok');
    const api = new ApiClient(store, () => 'http://gw', fakeFetch(401, { error: 'UNAUTHORIZED' }, {}));

    await expect(api.get('/api/v1/appointments')).rejects.toMatchObject({ status: 401 });
    expect(store.token()).toBeNull();
  });

  it('reports a network failure as status 0', async () => {
    const failing = (async () => { throw new TypeError('offline'); }) as unknown as typeof fetch;
    const api = new ApiClient(storeWithToken(null), () => 'http://gw', failing);

    await expect(api.get('/api/v1/barbershops')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('refuses to call anything that is not the api', async () => {
    const api = new ApiClient(storeWithToken(null), () => 'http://gw', fakeFetch(200, {}, {}));

    await expect(api.get('https://elsewhere.example')).rejects.toThrow('/api/');
  });
});
