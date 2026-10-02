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
