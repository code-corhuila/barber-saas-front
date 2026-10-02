import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, Session, sessionStore } from '../session/session-store';

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

  signOut(): void {
    sessionStore.clear();
  }
}
