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
  /** auth-service.yaml 3.0.0 (ADR-018). */
  emailVerified?: boolean;
}

/** auth-service.yaml AuthResponse. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SessionUser;
}

/** A client's token bound to the barbershop they picked (auth-service.yaml DEC-AUTH-06). */
export interface BarbershopBinding {
  barbershopId: string;
  accessToken: string;
  expiresAt: number;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  /** The refresh token lives 7 days (HU-AUTH-005); the session can be renewed until then. */
  refreshExpiresAt?: number;
  user: SessionUser;
  barbershop?: BarbershopBinding;
}

/** POST /api/v1/auth/refresh: the new tokens, or a rejection (an ApiError with its status). */
export type Refresher = (refreshToken: string) => Promise<AuthResponse>;

/** The refresh token's lifetime (auth-service.yaml: opaque, single use, valid 7 days). */
const REFRESH_LIFETIME_MS = 7 * 24 * 3600 * 1000;
/** Renew when the access token has less than this left, so no request leaves with an expired one. */
export const RENEW_MARGIN_MS = 5 * 60 * 1000;

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

  private renewing: Promise<void> | null = null;

  /** The session while it can still be renewed; an older one is forgotten. */
  get(): Session | null {
    if (this.current && (this.current.refreshExpiresAt ?? this.current.expiresAt) <= this.now()) {
      this.clear();
    }
    return this.current;
  }

  /** The bound token while it is valid, else the login token while it is valid: the one every request carries. */
  token(): string | null {
    const session = this.get();
    if (this.binding()) return this.binding()!.accessToken;
    return session && session.expiresAt > this.now() ? session.accessToken : null;
  }

  /**
   * Renews the tokens once the access token is about to expire (HU-AUTH-005). Concurrent callers share
   * one renewal. A rejected refresh token (401) ends the session; a network failure keeps it for later.
   */
  async ensureFresh(refresh: Refresher): Promise<void> {
    const session = this.get();
    if (!session || session.expiresAt - RENEW_MARGIN_MS > this.now()) return;
    this.renewing ??= refresh(session.refreshToken)
      .then((auth) => this.renew(auth))
      .catch((err: { status?: number }) => {
        if (err?.status === 401 || err?.status === 403) this.clear();
      })
      .finally(() => { this.renewing = null; });
    return this.renewing;
  }

  /** New tokens of the same session: the client's barbershop binding is kept. */
  renew(auth: AuthResponse): void {
    const current = this.get();
    const next: Session = { ...this.fromAuth(auth), barbershop: current?.barbershop };
    this.storage?.setItem(KEY, JSON.stringify(next));
    this.set(next);
  }

  /** Staff: their own barbershop. Client: the one they entered, while its token is valid. */
  barbershopId(): string | null {
    return this.get()?.user.barbershopId ?? this.binding()?.barbershopId ?? null;
  }

  /** The client's valid binding, or null once it expired (the login token is sent again). */
  binding(): BarbershopBinding | null {
    const bound = this.get()?.barbershop;
    return bound && bound.expiresAt > this.now() ? bound : null;
  }

  /** True when the client is bound to that barbershop for at least `marginMs` more. */
  boundTo(barbershopId: string, marginMs = 0): boolean {
    const bound = this.binding();
    return !!bound && bound.barbershopId === barbershopId && bound.expiresAt - marginMs > this.now();
  }

  bindBarbershop(barbershopId: string, accessToken: string, expiresIn: number): void {
    const session = this.get();
    if (!session) return;
    const next: Session = { ...session, barbershop: { barbershopId, accessToken, expiresAt: this.now() + expiresIn * 1000 } };
    this.storage?.setItem(KEY, JSON.stringify(next));
    this.set(next);
  }

  signIn(auth: AuthResponse): Session {
    const session = this.fromAuth(auth);
    this.storage?.setItem(KEY, JSON.stringify(session));
    this.set(session);
    return session;
  }

  /** The profile was edited (HU-AUTH-006): the same session shows the new name and phone. */
  updateUser(user: SessionUser): void {
    const current = this.get();
    if (!current) return;
    const next = { ...current, user };
    this.storage?.setItem(KEY, JSON.stringify(next));
    this.set(next);
  }

  private fromAuth(auth: AuthResponse): Session {
    return {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresAt: this.now() + auth.expiresIn * 1000,
      refreshExpiresAt: this.now() + REFRESH_LIFETIME_MS,
      user: auth.user,
    };
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
