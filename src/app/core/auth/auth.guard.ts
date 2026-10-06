import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { SessionUser } from '../session/session-store';
import { homeFor } from '../../layout/navigation';
import { SessionService } from './session.service';

/** Without a session, a protected route sends to sign-in and comes back after it. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(SessionService).signedIn() ||
  inject(Router).createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });

/** The welcome screen is for visitors: a signed-in user goes to the first tab of their role. */
export const welcomeGuard: CanActivateFn = () => {
  const user = inject(SessionService).user();
  return !user || inject(Router).parseUrl(homeFor(user.role));
};

/** A domain only some roles open (e.g. /platform for SUPER_ADMIN, FR-025): others go to their home. */
export function roleGuard(...roles: SessionUser['role'][]): CanActivateFn {
  return () => {
    const user = inject(SessionService).user();
    return (user !== null && roles.includes(user.role)) || inject(Router).parseUrl(homeFor(user?.role));
  };
}
