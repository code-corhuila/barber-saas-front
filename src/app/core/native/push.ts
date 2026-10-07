import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { ApiClient } from '../http/api-client';

/** What the push plugin offers, narrowed to what this file uses (and to what a test can fake). */
export interface PushPlugin {
  checkPermissions(): Promise<{ receive: string }>;
  requestPermissions(): Promise<{ receive: string }>;
  register(): Promise<void>;
  addListener(event: 'registration', fn: (token: { value: string }) => void): Promise<unknown>;
  addListener(event: 'registrationError', fn: (error: { error: string }) => void): Promise<unknown>;
  addListener(event: 'pushNotificationActionPerformed', fn: () => void): Promise<unknown>;
}

export interface PushDependencies {
  plugin: PushPlugin;
  api: Pick<ApiClient, 'post'>;
  /** Where a tapped notification leads: the inbox of the Avisos tab. */
  openInbox: () => void;
}

/**
 * Push needs the installed app and a Firebase project: android:package marks the build that carries
 * android/app/google-services.json. Without it the plugin would crash the app on register(), so
 * every other build keeps the notices in the inbox only.
 */
export function pushAvailable(win: { __BARBERSAAS_PUSH__?: boolean } = globalThis as never): boolean {
  return Capacitor.isNativePlatform() && win.__BARBERSAAS_PUSH__ === true;
}

/**
 * F-4: asks for the permission once, gets this device's FCM token and registers it for the signed-in
 * user with POST /api/v1/device-tokens (notification-service.yaml); the same token again answers 200.
 * Called after each sign-in, so the device follows whoever uses it.
 */
export class DevicePush {
  private listening = false;

  constructor(private readonly deps: PushDependencies) {}

  async enable(): Promise<void> {
    const { plugin } = this.deps;
    let permission = (await plugin.checkPermissions()).receive;
    if (permission === 'prompt' || permission === 'prompt-with-rationale') {
      permission = (await plugin.requestPermissions()).receive;
    }
    if (permission !== 'granted') {
      return;   // the notices stay in the inbox
    }
    if (!this.listening) {
      this.listening = true;
      await plugin.addListener('registration', (token) => void this.save(token.value));
      await plugin.addListener('registrationError', (e) => console.warn('push registration failed', e.error));
      await plugin.addListener('pushNotificationActionPerformed', () => this.deps.openInbox());
    }
    await plugin.register();
  }

  private async save(token: string): Promise<void> {
    try {
      await this.deps.api.post('/api/v1/device-tokens', { token, platform: 'ANDROID' },
        { idempotencyKey: crypto.randomUUID() });
    } catch (e) {
      console.warn('device token not registered', e);   // push is a bonus: the inbox still works
    }
  }
}

export function devicePush(api: Pick<ApiClient, 'post'>, openInbox: () => void): DevicePush {
  return new DevicePush({ plugin: PushNotifications as unknown as PushPlugin, api, openInbox });
}
