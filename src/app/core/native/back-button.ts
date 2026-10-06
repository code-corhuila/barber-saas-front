import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/** What the Android back button does: go back while there is history, leave the app otherwise. */
export function onBack(canGoBack: boolean, back: () => void, exit: () => void): void {
  if (canGoBack) {
    back();
  } else {
    exit();
  }
}

/**
 * Without a listener Capacitor closes the app on every back press, even in the middle of a flow.
 * Only the installed app has the button; in a browser this does nothing.
 */
export function listenToBackButton(): void {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  void App.addListener('backButton', ({ canGoBack }) =>
    onBack(canGoBack, () => window.history.back(), () => void App.exitApp()),
  );
}
