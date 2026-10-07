import { describe, expect, it, vi } from 'vitest';
import { DevicePush, pushAvailable, type PushPlugin } from './push';

function fakePlugin(permission: string, afterRequest = permission) {
  const listeners: Record<string, (arg: never) => void> = {};
  const plugin = {
    checkPermissions: vi.fn(async () => ({ receive: permission })),
    requestPermissions: vi.fn(async () => ({ receive: afterRequest })),
    register: vi.fn(async () => listeners['registration']?.({ value: 'fcm-token-1' } as never)),
    addListener: vi.fn(async (event: string, fn: (arg: never) => void) => { listeners[event] = fn; }),
  };
  return { plugin: plugin as unknown as PushPlugin & typeof plugin, listeners };
}

describe('DevicePush', () => {
  it('asks once, gets the token and registers it as an Android device', async () => {
    const { plugin } = fakePlugin('prompt', 'granted');
    const post = vi.fn(async () => ({}));
    await new DevicePush({ plugin, api: { post } as never, openInbox: () => undefined }).enable();
    await Promise.resolve();

    expect(plugin.requestPermissions).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith('/api/v1/device-tokens', { token: 'fcm-token-1', platform: 'ANDROID' },
      expect.objectContaining({ idempotencyKey: expect.any(String) }));
  });

  it('does nothing when the user refuses: the notices stay in the inbox', async () => {
    const { plugin } = fakePlugin('denied');
    const post = vi.fn();
    await new DevicePush({ plugin, api: { post } as never, openInbox: () => undefined }).enable();

    expect(plugin.register).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('listens once across sign-ins and opens the inbox when a notification is tapped', async () => {
    const { plugin, listeners } = fakePlugin('granted');
    const openInbox = vi.fn();
    const push = new DevicePush({ plugin, api: { post: vi.fn(async () => ({})) } as never, openInbox });
    await push.enable();
    await push.enable();
    listeners['pushNotificationActionPerformed']({} as never);

    expect(plugin.addListener).toHaveBeenCalledTimes(3);
    expect(plugin.register).toHaveBeenCalledTimes(2);
    expect(openInbox).toHaveBeenCalledOnce();
  });

  it('a failed registration never breaks the app', async () => {
    const { plugin } = fakePlugin('granted');
    const post = vi.fn(async () => { throw new Error('offline'); });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(new DevicePush({ plugin, api: { post } as never, openInbox: () => undefined }).enable())
      .resolves.toBeUndefined();
    warn.mockRestore();
  });
});

describe('pushAvailable', () => {
  it('is off in a browser, whatever the build says', () => {
    expect(pushAvailable({ __BARBERSAAS_PUSH__: true })).toBe(false);
  });
});
