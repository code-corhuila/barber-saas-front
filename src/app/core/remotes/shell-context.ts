import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { apiClient } from '../http/api-client';
import { enterBarbershop } from '../session/enter-barbershop';
import { sessionStore } from '../session/session-store';
import type { ShellSession } from './mount-contract';

/**
 * What an Ionic Angular domain app receives from the shell (ADR-013). Its routes are loaded under
 * the shell's route with `data: { shell: ShellContext }`; requests need nothing from here, because
 * they go through the shell's HttpClient and its interceptor. Each Angular domain app keeps a copy
 * of these types in `src/app/shell-context.ts` (copied, never imported).
 */
export interface ShellContext {
  session: ShellSession;
  /** Navigate anywhere in the app, e.g. navigate('/appointments'). */
  navigate(path: string): void;
}

/** The one session of the app, as every domain app sees it, React or Angular. */
export function shellSession(): ShellSession {
  return {
    user: () => sessionStore.get()?.user ?? null,
    signIn: (auth) => sessionStore.signIn(auth),
    signOut: () => sessionStore.clear(),
    subscribe: (listener) => sessionStore.subscribe((s) => listener(s?.user ?? null)),
    enterBarbershop: (barbershopId) => enterBarbershop(sessionStore, apiClient, barbershopId),
    barbershopId: () => sessionStore.barbershopId(),
  };
}

/** Resolves `data.shell` for the routes of an Ionic Angular domain app. */
export const shellContextResolver: ResolveFn<ShellContext> = () => {
  const router = inject(Router);
  return { session: shellSession(), navigate: (path) => void router.navigateByUrl(path) };
};
