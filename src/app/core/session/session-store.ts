/** The user as identity-auth returns it (auth-service.yaml UserSummary). */
export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN_BARBERSHOP' | 'BARBER' | 'CLIENT';
  barbershopId: string | null;
  isActive: boolean;
}

/** auth-service.yaml AuthResponse. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SessionUser;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: SessionUser;
}

type Listener = (session: Session | null) => void;

const KEY = 'barbersaas.session';

/**
 * The session, held ONCE for the whole app (norm 5.4.1). Framework-neutral so the Angular shell
 * and the React domain apps read the same state; only the shell writes it.
 */
export class SessionStore {
  private current: Session | null;
  private readonly listeners = new Set<Listener>();

  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined,
              private readonly now: () => number = Date.now) {
    this.current = this.read();
  }

  get(): Session | null {
    if (this.current && this.current.expiresAt <= this.now()) {
      this.clear();
    }
    return this.current;
  }

  token(): string | null {
    return this.get()?.accessToken ?? null;
  }

  signIn(auth: AuthResponse): Session {
    const session: Session = {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresAt: this.now() + auth.expiresIn * 1000,
      user: auth.user,
    };
    this.storage?.setItem(KEY, JSON.stringify(session));
    this.set(session);
    return session;
  }

  clear(): void {
    this.storage?.removeItem(KEY);
    this.set(null);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(session: Session | null): void {
    this.current = session;
    this.listeners.forEach((l) => l(session));
  }

  private read(): Session | null {
    try {
      const raw = this.storage?.getItem(KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }
}

export const sessionStore = new SessionStore(globalThis.localStorage);
