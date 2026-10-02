import { SessionStore, sessionStore } from '../session/session-store';
import { gatewayUrl, TIMEOUT_MS } from './gateway';
import { ApiError, toApiError } from './api-error';

export type { ApiError, FieldError } from './api-error';

export interface RequestOptions {
  headers?: Record<string, string>;
  /** Sent as Idempotency-Key; reuse the same value when retrying the same intention. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

/**
 * The one HTTP client of the app for the Ionic React domain apps (ADR-013, annex H): it adds the
 * gateway URL, the token and a fresh X-Correlation-Id, applies the 10 s timeout, and turns every
 * failure into an ApiError whose userMessage is already decided. A domain app never calls fetch
 * against the API itself. The Angular interceptor applies exactly the same rules.
 */
export class ApiClient {
  constructor(private readonly session: SessionStore,
              private readonly baseUrl: () => string = gatewayUrl,
              private readonly fetchFn: typeof fetch = (...args) => globalThis.fetch(...args)) {}

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  async request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    if (!path.startsWith('/api/')) {
      throw new Error(`apiClient only calls the gateway: '${path}' must start with /api/`);
    }
    const correlationId = crypto.randomUUID();
    const token = this.session.token();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Correlation-Id': correlationId,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
      ...options.headers,
    };
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
    options.signal?.addEventListener('abort', () => timeout.abort());

    let response: Response;
    try {
      response = await this.fetchFn(this.baseUrl() + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: timeout.signal,
      });
    } catch {
      const code = options.signal?.aborted ? 'CANCELLED' : timeout.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR';
      throw toApiError(0, { error: code }, null, correlationId);
    } finally {
      clearTimeout(timer);
    }

    const payload = await readJson(response);
    if (!response.ok) {
      if (response.status === 401) this.session.clear();
      throw toApiError(response.status, payload, response.headers.get('X-Correlation-Id'), correlationId) as ApiError;
    }
    return payload as T;
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const apiClient = new ApiClient(sessionStore);
export default apiClient;
