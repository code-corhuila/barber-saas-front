import type { CapacitorConfig } from '@capacitor/cli';

// The native app is the shell (ADR-013). `npx cap add android` creates the Android project from
// the web build in dist/shell/browser; domain apps are copied into that build before packaging.
const config: CapacitorConfig = {
  appId: 'co.edu.corhuila.barbersaas',
  appName: 'BarberSaaS',
  webDir: 'dist/shell/browser',
};

export default config;
