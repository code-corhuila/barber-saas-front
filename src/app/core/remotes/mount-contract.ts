import type { ApiClient } from '../http/api-client';
import type { AuthResponse, SessionUser } from '../session/session-store';

/**
 * The contract between the Angular shell and every Ionic React domain app (ADR-013).
 *
 * A React domain app exposes, through Native Federation, a module './mount' whose default export
 * (or named export `mount`) is a MountFunction. The shell calls it with an empty element and this
 * context, and calls the returned function when the user leaves the domain. The React app:
 * - requests the API ONLY through `context.api` (never fetch or axios against /api/);
 * - reads the session from `context.session` and never stores a token itself;
 * - navigates between domains with `context.navigate`; inside its own domain it may use its own
 *   router with `context.basePath` as base.
 * Copy this file (the types) into each React domain app as `src/shell-contract.ts`.
 */
export interface ShellSession {
  user(): SessionUser | null;
  signIn(auth: AuthResponse): void;
  signOut(): void;
  /** Called with the new user (or null) every time the session changes; returns an unsubscribe. */
  subscribe(listener: (user: SessionUser | null) => void): () => void;
  /**
   * Call before any tenant-scoped request made for a barbershop the user picked (DEC-AUTH-06).
   * For a CLIENT it gets a token bound to that barbershop, and `api` sends it from then on; staff
   * resolve at once. Rejects with the shell's ApiError: NOT_FOUND (closed or unknown barbershop),
   * SERVICE_UNAVAILABLE (it could not be checked).
   */
  enterBarbershop(barbershopId: string): Promise<void>;
  /** Staff: their own barbershop. Client: the one entered, while its token is valid. */
  barbershopId(): string | null;
}

export interface MountContext {
  api: ApiClient;
  session: ShellSession;
  /** Path where the shell mounted this domain, e.g. '/appointments'. */
  basePath: string;
  /** The rest of the URL inside the domain when it was mounted, e.g. '/new'. */
  initialPath: string;
  /** Navigate anywhere in the app, e.g. navigate('/sign-in') or navigate('/appointments/new'). */
  navigate(path: string): void;
}

export type Unmount = () => void;
export type MountFunction = (element: HTMLElement, context: MountContext) => Unmount | Promise<Unmount>;
