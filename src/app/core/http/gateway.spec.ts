import { afterEach, describe, expect, it } from 'vitest';
import { gatewayUrl } from './gateway';

const storage = (value: string | null) => ({ getItem: () => value });
const global = globalThis as { __BARBERSAAS_GATEWAY_URL__?: string };

describe('gatewayUrl', () => {
  afterEach(() => { delete global.__BARBERSAAS_GATEWAY_URL__; });

  it('is localhost:8000 in the browser during development', () => {
    expect(gatewayUrl(storage(null))).toBe('http://localhost:8000');
  });

  it('uses the address written into the packaged app, e.g. the emulator host', () => {
    global.__BARBERSAAS_GATEWAY_URL__ = 'http://10.0.2.2:8000';

    expect(gatewayUrl(storage(null))).toBe('http://10.0.2.2:8000');
  });

  it('lets the device storage override both', () => {
    global.__BARBERSAAS_GATEWAY_URL__ = 'http://10.0.2.2:8000';

    expect(gatewayUrl(storage('http://192.168.1.20:8000'))).toBe('http://192.168.1.20:8000');
  });
});
