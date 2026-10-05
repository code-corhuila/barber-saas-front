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
