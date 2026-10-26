import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, Session, sessionStore } from '../session/session-store';
import { apiClient } from '../http/api-client';

/** The Angular view of the one session store: signals for templates and guards. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly state = signal<Session | null>(sessionStore.get());

  readonly session = this.state.asReadonly();
  readonly user = computed(() => this.state()?.user ?? null);
  readonly signedIn = computed(() => this.state() !== null);

  constructor() {
    sessionStore.subscribe((session) => this.state.set(session));
  }

  token(): string | null {
    return sessionStore.token();
  }

  signIn(auth: AuthResponse): void {
    sessionStore.signIn(auth);
  }

  /**
   * Revokes the refresh token on the server (HU-AUTH-005), then forgets the session at once: the
   * phone never waits for the answer, and a failed logout leaves only a token that expires by itself.
   */
  signOut(): void {
    const session = sessionStore.get();
    if (session && session.expiresAt > Date.now()) {
      void apiClient.post('/api/v1/auth/logout', { refreshToken: session.refreshToken },
        { headers: { Authorization: `Bearer ${session.accessToken}` } }).catch(() => undefined);
    }
    sessionStore.clear();
  }
}
