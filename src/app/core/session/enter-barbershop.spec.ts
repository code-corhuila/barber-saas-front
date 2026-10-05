import { describe, expect, it } from 'vitest';
import { ApiClient } from '../http/api-client';
import { AuthResponse, SessionStore } from './session-store';
import { enterBarbershop } from './enter-barbershop';

const client: AuthResponse = {
  accessToken: 'login', refreshToken: 'r', expiresIn: 86_400,
  user: { id: 'u-1', fullName: 'Maria', email: 'maria@example.com', phone: null, profilePhotoUrl: null,
    role: 'CLIENT', barbershopId: null, isActive: true },
};

function setup(user: AuthResponse | null, status = 200) {
  let now = 0;
  const store = new SessionStore(undefined, () => now);
  if (user) store.signIn(user);
  const calls: { url: string; auth: string | null; body: string }[] = [];
  const fetchFn = (async (url: string, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({ url, auth: headers['Authorization'] ?? null, body: String(init?.body) });
    const shop = JSON.parse(String(init?.body)).barbershopId;
    const payload = status === 200
      ? { accessToken: `bound-${shop}`, expiresIn: 3600, barbershopId: shop }
      : { error: 'NOT_FOUND', message: 'The barbershop does not exist' };
    return new Response(JSON.stringify(payload), { status });
  }) as unknown as typeof fetch;
  const api = new ApiClient(store, () => 'http://gw', fetchFn);
  return { store, api, calls, advance: (ms: number) => { now += ms; } };
}

describe('enterBarbershop', () => {
  it('asks identity-auth once for a client and then sends the bound token', async () => {
    const { store, api, calls } = setup(client);

    await enterBarbershop(store, api, 'shop-1');
    await enterBarbershop(store, api, 'shop-1');

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://gw/api/v1/auth/barbershop-token');
    expect(calls[0].auth).toBe('Bearer login');
    expect(JSON.parse(calls[0].body)).toEqual({ barbershopId: 'shop-1' });
    expect(store.token()).toBe('bound-shop-1');
    expect(store.barbershopId()).toBe('shop-1');
  });

  it('asks again for another barbershop or when the bound token is about to expire', async () => {
    const { store, api, calls, advance } = setup(client);
    await enterBarbershop(store, api, 'shop-1');

    await enterBarbershop(store, api, 'shop-2');
    expect(store.token()).toBe('bound-shop-2');

    advance(3_550_000);
    await enterBarbershop(store, api, 'shop-2');
    expect(calls).toHaveLength(3);
  });

  it('does nothing for staff: their token already carries the barbershop', async () => {
    const { store, api, calls } = setup({ ...client, user: { ...client.user, role: 'BARBER', barbershopId: 'shop-1' } });

    await enterBarbershop(store, api, 'shop-1');

    expect(calls).toHaveLength(0);
    expect(store.token()).toBe('login');
  });

  it('rejects with the ApiError of a closed barbershop and keeps the login token', async () => {
    const { store, api } = setup(client, 404);

    await expect(enterBarbershop(store, api, 'shop-x')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(store.token()).toBe('login');
  });

  it('rejects when nobody is signed in', async () => {
    const { store, api, calls } = setup(null);

    await expect(enterBarbershop(store, api, 'shop-1')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(calls).toHaveLength(0);
  });
});
