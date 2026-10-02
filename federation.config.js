const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'shell',
  // The one HTTP client of the app, framework-neutral, for the Ionic React domain apps (ADR-013).
  // Angular domain apps do not need it: they run inside the shell's injector and get its HttpClient.
  exposes: {
    './apiClient': './src/app/core/http/api-client.ts',
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  // Entry points the application never loads: sharing them would bundle their dependencies.
  skip: [
    'rxjs/ajax', 'rxjs/fetch', 'rxjs/testing', 'rxjs/webSocket',
    '@angular/platform-browser/animations', '@angular/platform-browser/animations/async',
    '@capacitor/cli', 'vitest',
  ],
});
