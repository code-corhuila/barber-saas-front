# barber-saas-front

> Front-end shell: packages the domain UIs

Part of the **LMS Library** distributed system — team `lms-library`, Grupo 2.
Governance and documentation live in [`library-docs`](https://github.com/code-corhuila/library-docs).

## Branching

Three permanent branches. **None of them accepts a direct commit** — you enter through a child
branch and leave through a Pull Request.

```
develop  <--PR--  feat/... fix/... chore/...
qa       <--PR--  qa/...
main     <--PR--  release/...  hotfix/...
```

Promotion happens **by re-application** (`git cherry-pick -x`), never by merging one permanent
branch into another: `merge develop -> qa` and `merge qa -> main` do not exist in this model.

`main` requires **1 approval from `ariel5253`**. On `develop` and `qa` the team sets its own review
rule.

Full policy: `00-governance/branching-policy.md` in `library-docs`.

---

## BarberSaaS — what this repository is

The **shell** of the BarberSaaS app (ADR-013): one hybrid mobile app built with Angular 21,
Ionic 8 and Capacitor 7. It owns what must exist exactly once — navigation, sign-in state, the
**only HTTP client** and the **only session** (norm 5.4.1) — and loads each domain app with Native
Federation: Ionic React apps (identity-auth, barbershop, appointment, schedule) through a mount
contract, Ionic Angular apps (platform-admin, finance-inventory, loyalty, notifications) as routes.

```
src/app/core/http/api-client.ts            the client React domain apps use (exposed as ./apiClient)
src/app/core/http/api.interceptor.ts       the same rules for Angular requests
src/app/core/http/api-error.ts             every error → shared envelope + on-screen message, in ONE place
src/app/core/session/session-store.ts      the one session (framework-neutral)
src/app/core/remotes/mount-contract.ts     the contract of the React domain apps
src/app/core/remotes/react-remote-host.component.ts   mounts a React domain app
src/app/app.routes.ts                      one entry per domain app
public/federation.manifest.json            where each domain app is served from
capacitor.config.ts                        the native app
```

### For the owner of a React domain app

1. Expose `./mount` with Native Federation; its default export is
   `mount(element, context) => unmount` (types in `src/app/core/remotes/mount-contract.ts`;
   copy them as `src/shell-contract.ts`).
2. Request the API **only** through `context.api` (`get/post/put/patch/delete('/api/v1/...')`,
   `idempotencyKey` on creations). Never `fetch` or `axios` against `/api/`.
3. Read the user from `context.session`; never store a token. Use a memory router with
   `context.initialPath`, and `context.navigate('/...')` to leave your domain.
   Before a tenant-scoped request for a barbershop the user picked, `await
   context.session.enterBarbershop(barbershopId)`: a client gets a token bound to it (DEC-AUTH-06)
   and `context.api` sends it from then on; staff resolve at once.
4. Show `error.userMessage` on screen: the shell already decided it.
5. Your dev server port: identity-auth 4301, barbershop 4302, schedule 4303, appointment 4304
   (`public/federation.manifest.json`). Adding a new entry or route is a small pull request
   opened right after `git pull`.

### How to start it

```bash
npm ci
npm start                     # http://localhost:4200 — the gateway must be up at :8000
npm run build                 # dist/shell/browser
npx cap add android           # once, with the Android SDK installed; then: npx cap sync android
```

On a phone the gateway is not `localhost`: set `localStorage['barbersaas.gatewayUrl']`.

### Where the data is

Only the session, in the device's `localStorage` (`barbersaas.session`). Everything else comes from
the services through the gateway.

### How it is tested

`npm test` (Vitest, no browser): the API client, the error messages and the session store.
CI runs `npm ci`, `npm test` and `npm run build`.

### What is missing

The Android/iOS projects (`npx cap add`), copying each domain app into the packaged build, and the
Ionic Angular domain apps of phase 2.
