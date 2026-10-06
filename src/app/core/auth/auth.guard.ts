import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
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
