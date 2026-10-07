#!/usr/bin/env node
// Packages the hybrid app for Android (ADR-013): builds the shell and every domain app of
// public/federation.manifest.json, copies each domain app INTO the shell build so the APK does not
// depend on localhost dev servers, writes a manifest with root-relative addresses and the gateway
// address, and syncs the result into the Android project.
//
// usage: npm run android:package [-- --gateway http://10.0.2.2:8000] [--apps ..]
//   --gateway  where the packaged app finds the api-gateway (default: the emulator's host)
//   --apps     folder holding the domain app repositories as siblings (default: ..)
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const gateway = option('gateway', 'http://10.0.2.2:8000');
const appsDir = resolve(root, option('apps', '..'));
const web = join(root, 'dist', 'shell', 'browser');
const run = (command, cwd) => {
  console.log(`> ${command}   (${cwd})`);
  execSync(command, { cwd, stdio: 'inherit' });
};

/** A domain app repository, cloned as barber-saas-<name>-app or with the short name <name>-app. */
function appFolder(name) {
  const found = [`barber-saas-${name}-app`, `${name}-app`].map((f) => join(appsDir, f)).find(existsSync);
  if (!found) {
    throw new Error(`${name}: clone barber-saas-${name}-app next to barber-saas-front (looked in ${appsDir})`);
  }
  return found;
}

run('npx ng build', root);

const remotes = JSON.parse(readFileSync(join(root, 'public', 'federation.manifest.json'), 'utf8'));
const packaged = {};
for (const name of Object.keys(remotes)) {
  const folder = appFolder(name);
  if (!existsSync(join(folder, 'node_modules'))) run('npm ci', folder);
  run('npm run build', folder);
  const target = join(web, 'remotes', name);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(folder, 'dist', name), target, { recursive: true });
  // Root-relative: Native Federation fetches this and import()s the files next to it, and import()
  // refuses a bare 'remotes/...' specifier. '/' is the shell's origin in a browser and in the APK.
  packaged[name] = `/remotes/${name}/remoteEntry.json`;
}
writeFileSync(join(web, 'federation.manifest.json'), JSON.stringify(packaged, null, 2) + '\n');

const index = join(web, 'index.html');
// Push only in a build that carries the developer's own Firebase file (never versioned): without
// it the push plugin would crash the app, so the shell keeps the notices in the inbox only.
const push = existsSync(join(root, 'android', 'app', 'google-services.json'));
const script = `<script>window.__BARBERSAAS_GATEWAY_URL__ = ${JSON.stringify(gateway)};`
  + ` window.__BARBERSAAS_PUSH__ = ${push};</script>`;
writeFileSync(index, readFileSync(index, 'utf8').replace('</head>', `  ${script}\n</head>`));

run('npx cap sync android', root);
console.log(`\nPackaged ${Object.keys(packaged).join(', ')} with the gateway at ${gateway}`
  + (push ? ', push on.' : ', push off (no android/app/google-services.json).'));
console.log('Open it in Android Studio with: npx cap open android');
