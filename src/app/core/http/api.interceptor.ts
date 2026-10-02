import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';
import { SessionService } from '../auth/session.service';
import { toApiError } from './api-error';
import { gatewayUrl, TIMEOUT_MS } from './gateway';

/**
 * Every request to '/api/...' made through Angular's HttpClient — the shell and the Ionic Angular
 * domain apps — goes through here: the gateway URL, the token, a fresh X-Correlation-Id, a timeout
 * and one shape for every error. Same rules as api-client.ts, which serves the React apps.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) return next(req);
  const session = inject(SessionService);
  const correlationId = crypto.randomUUID();
  const token = session.token();
  const outgoing = req.clone({
    url: gatewayUrl() + req.url,
    setHeaders: {
      'X-Correlation-Id': correlationId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return next(outgoing).pipe(
    timeout(TIMEOUT_MS),
    catchError((err: unknown) => {
      if (err instanceof TimeoutError) {
        return throwError(() => toApiError(0, { error: 'TIMEOUT' }, null, correlationId));
      }
      const http = err instanceof HttpErrorResponse ? err : new HttpErrorResponse({ status: 0, error: err });
      if (http.status === 401) session.signOut();
      return throwError(() => toApiError(http.status, http.error, http.headers?.get('X-Correlation-Id') ?? null, correlationId));
    }),
  );
};
