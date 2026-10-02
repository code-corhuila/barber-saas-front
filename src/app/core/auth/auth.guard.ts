import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

/** Without a session, a protected route sends to sign-in and comes back after it. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(SessionService).signedIn() ||
  inject(Router).createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
