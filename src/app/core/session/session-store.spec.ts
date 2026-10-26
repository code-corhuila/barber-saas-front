import { describe, expect, it } from 'vitest';
import { AuthResponse, SessionStore } from './session-store';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const auth: AuthResponse = {
  accessToken: 'access', refreshToken: 'refresh', expiresIn: 60,
  user: { id: 'u-1', fullName: 'Maria', email: 'maria@example.com', phone: null, profilePhotoUrl: null,
    role: 'CLIENT', barbershopId: null, isActive: true },
};

describe('SessionStore', () => {
  it('keeps the session across reloads', () => {
    const storage = memoryStorage();
    new SessionStore(storage, () => 0).signIn(auth);

    expect(new SessionStore(storage, () => 1000).token()).toBe('access');
  });

  it('forgets an expired session', () => {
    let now = 0;
    const store = new SessionStore(memoryStorage(), () => now);
    store.signIn(auth);
    now = 61_000;

    expect(store.token()).toBeNull();
  });

  it('tells every listener when the session changes', () => {
    const store = new SessionStore(memoryStorage(), () => 0);
    const seen: (string | null)[] = [];
    store.subscribe((s) => seen.push(s?.user.id ?? null));

    store.signIn(auth);
    store.clear();

    expect(seen).toEqual(['u-1', null]);
  });
});

describe('SessionStore, a client bound to a barbershop (DEC-AUTH-06)', () => {
  it('sends the bound token while it is valid and the login token after it expires', () => {
    let now = 0;
    const store = new SessionStore(memoryStorage(), () => now);
    store.signIn({ ...auth, expiresIn: 86_400 });
    store.bindBarbershop('shop-1', 'bound', 3600);

    expect(store.token()).toBe('bound');
    expect(store.barbershopId()).toBe('shop-1');

    now = 3_601_000;
    expect(store.token()).toBe('access');
    expect(store.barbershopId()).toBeNull();
  });

  it('keeps the binding across reloads and drops it on a new sign-in or sign-out', () => {
    const storage = memoryStorage();
    const store = new SessionStore(storage, () => 0);
    store.signIn({ ...auth, expiresIn: 86_400 });
    store.bindBarbershop('shop-1', 'bound', 3600);

    expect(new SessionStore(storage, () => 0).token()).toBe('bound');

    store.signIn({ ...auth, expiresIn: 86_400 });
    expect(store.barbershopId()).toBeNull();
    store.bindBarbershop('shop-1', 'bound', 3600);
    store.clear();
    expect(store.token()).toBeNull();
  });

  it('gives staff the barbershop of their own account', () => {
    const store = new SessionStore(memoryStorage(), () => 0);
    store.signIn({ ...auth, user: { ...auth.user, role: 'BARBER', barbershopId: 'shop-9' } });

    expect(store.barbershopId()).toBe('shop-9');
  });
});

describe('SessionStore, renewing the session (HU-AUTH-005)', () => {
  const renewed: AuthResponse = { ...auth, accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 86_400 };

  it('renews with the refresh token once the access token is about to expire, keeping the binding', async () => {
    let now = 0;
    const store = new SessionStore(memoryStorage(), () => now);
    store.signIn({ ...auth, expiresIn: 3600 });
    store.bindBarbershop('shop-1', 'bound', 7200);
    const used: string[] = [];
    const refresh = async (token: string) => { used.push(token); return renewed; };

    await store.ensureFresh(refresh);
    expect(used).toEqual([]);                                    // an hour left: nothing to do

    now = 3_400_000;
    await Promise.all([store.ensureFresh(refresh), store.ensureFresh(refresh)]);
    expect(used).toEqual(['refresh']);                           // one renewal for both callers
    expect(store.get()?.accessToken).toBe('access-2');
    expect(store.binding()?.barbershopId).toBe('shop-1');
  });

  it('keeps an expired access token renewable for 7 days, then forgets the session', async () => {
    let now = 0;
    const store = new SessionStore(memoryStorage(), () => now);
    store.signIn(auth);
    now = 2 * 24 * 3600 * 1000;
    expect(store.token()).toBeNull();
    await store.ensureFresh(async () => renewed);
    expect(store.token()).toBe('access-2');

    now += 8 * 24 * 3600 * 1000;
    expect(store.get()).toBeNull();
  });

  it('ends the session when the refresh token is refused, and keeps it on a network failure', async () => {
    let now = 0;
    const store = new SessionStore(memoryStorage(), () => now);
    store.signIn(auth);
    now = 61_000;
    await store.ensureFresh(async () => { throw { status: 0 }; });
    expect(store.get()).not.toBeNull();
    await store.ensureFresh(async () => { throw { status: 401 }; });
    expect(store.get()).toBeNull();
  });
});
