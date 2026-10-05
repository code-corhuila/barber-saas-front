import type { ApiClient } from '../http/api-client';
import { toApiError } from '../http/api-error';
import type { SessionStore } from './session-store';

/** auth-service.yaml BarbershopTokenResponse. */
interface BarbershopToken {
  accessToken: string;
  expiresIn: number;
  barbershopId: string;
}

/** Ask again this long before the bound token expires, so no request carries an expired one. */
const RENEW_BEFORE_MS = 60_000;

/**
 * Binds a CLIENT to the barbershop they picked (DEC-AUTH-06): asks identity-auth for a token with
 * that barbershopId and stores it, so every request of the shell and the domain apps carries it.
 * Reuses a valid binding to the same barbershop; staff tokens already carry theirs, so it does
 * nothing for them. Rejects with the ApiError of the request (NOT_FOUND: closed or unknown
 * barbershop; SERVICE_UNAVAILABLE: it could not be checked), keeping the login token.
 */
export async function enterBarbershop(store: SessionStore, api: ApiClient, barbershopId: string): Promise<void> {
  const session = store.get();
  if (!session) {
    throw toApiError(401, { error: 'UNAUTHORIZED' }, null, crypto.randomUUID());
  }
  if (session.user.role !== 'CLIENT') return;
  if (store.boundTo(barbershopId, RENEW_BEFORE_MS)) return;
  const token = await api.post<BarbershopToken>('/api/v1/auth/barbershop-token', { barbershopId });
  store.bindBarbershop(token.barbershopId, token.accessToken, token.expiresIn);
}
