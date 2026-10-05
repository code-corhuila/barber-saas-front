/**
 * Only the shell knows where the gateway is; domain apps request '/api/v1/...'. On a phone the
 * gateway is not localhost: the packaging script writes the address into the packaged index.html
 * (`window.__BARBERSAAS_GATEWAY_URL__`, e.g. the emulator's host 10.0.2.2), and it can still be
 * overridden once in the device's storage.
 */
const DEFAULT_GATEWAY_URL = 'http://localhost:8000';
const OVERRIDE_KEY = 'barbersaas.gatewayUrl';

export const TIMEOUT_MS = 10_000;

export function gatewayUrl(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): string {
  const packaged = (globalThis as { __BARBERSAAS_GATEWAY_URL__?: string }).__BARBERSAAS_GATEWAY_URL__;
  return storage?.getItem(OVERRIDE_KEY) ?? packaged ?? DEFAULT_GATEWAY_URL;
}
