/**
 * Only the shell knows where the gateway is; domain apps request '/api/v1/...'. On a phone the
 * gateway is not localhost, so the URL can be overridden once in the device's storage.
 */
const DEFAULT_GATEWAY_URL = 'http://localhost:8000';
const OVERRIDE_KEY = 'barbersaas.gatewayUrl';

export const TIMEOUT_MS = 10_000;

export function gatewayUrl(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): string {
  return storage?.getItem(OVERRIDE_KEY) ?? DEFAULT_GATEWAY_URL;
}
