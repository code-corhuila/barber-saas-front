import type { CapacitorConfig } from '@capacitor/cli';

// The native app is the shell (ADR-013). `npm run android:package` builds the shell and every
// domain app into dist/shell/browser and syncs it into the Android project (android/).
const config: CapacitorConfig = {
  appId: 'co.edu.corhuila.barbersaas',
  appName: 'BarberSaaS',
  webDir: 'dist/shell/browser',
  server: {
    // Origin http://localhost: the one the api-gateway allows for the Android app (CORS,
    // nginx/conf.d/10-security.conf). Capacitor's default, https://localhost, is not allowed.
    androidScheme: 'http',
    // The development gateway is plain HTTP on the emulator's host (http://10.0.2.2:8000).
    // A qa or main build points at an HTTPS gateway and needs no cleartext.
    cleartext: true,
  },
  android: {
    // Android 15+ draws the app under the status and gesture bars; keep the web content clear of them.
    adjustMarginsForEdgeToEdge: 'auto',
  },
};

export default config;
