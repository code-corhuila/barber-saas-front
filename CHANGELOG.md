# Changelog

All notable changes to `barber-saas-front` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-10-08

MVP 2 (corte 2): first release of this repository to `main`, promoted from `develop` through `qa`
with `git cherry-pick -x` (norm 10–11).

User stories: code-corhuila/barber-saas-docs#3, code-corhuila/barber-saas-docs#4, code-corhuila/barber-saas-docs#5, code-corhuila/barber-saas-docs#9, code-corhuila/barber-saas-docs#12, code-corhuila/barber-saas-docs#59.

### Added

- **http:** keep the gateway url and the request timeout in one place
- **http:** decide the on-screen message of every api error in one place
- **session:** hold the one session of the app in a framework-neutral store
- **http:** add the one api client the react domain apps use
- **federation:** expose the api client of the shell and share the frameworks
- **shell:** add the document, the brand colours and the federation-first bootstrap
- **session:** expose the session to angular as signals
- **http:** apply the gateway, token, correlation and errors to every angular request
- **auth:** send to sign-in when a protected route has no session
- **remotes:** define the mount contract of the react domain apps
- **remotes:** mount a react domain app with the shell's client and session
- **shell:** provide the only http client of the app, ionic and the router
- **layout:** list the sections each role may open
- **layout:** greet the user and show their sections
- **layout:** answer unknown addresses
- **remotes:** replace an angular domain app that cannot load with a notice
- **routes:** mount sign-in, barbershops, schedule and appointments
- **layout:** add the title bar with the role's sections and sign-out
- **capacitor:** configure the native app from the shell's build
- **deploy:** serve the web build for development and review
- **session:** bind a client session to a barbershop
- **remotes:** give domain apps enterBarbershop and barbershopId
- **http:** read the gateway address written into the packaged app
- **native:** add the Android project
- **native:** package the domain apps inside the Android build
- **theme:** use the dark palette of the prototype
- **navigation:** define the tabs and the home of each role
- **shell:** show bottom tabs per role and a profile screen
- **home:** welcome visitors and send signed-in users to their tabs
- **android:** keep the content clear of the system bars in dark
- **auth:** add roleGuard for domains only some roles open
- **shell:** load Ionic Angular domain apps and mount platform-admin
- **navigation:** give SUPER_ADMIN the Plataforma tab
- **routes:** mount the notifications domain app at /notifications
- **navigation:** add the Avisos tab to the inbox for every role
- **navigation:** mount the finance domain app for the owner
- **navigation:** mount the loyalty domain app
- **native:** register the device for push after each sign-in

### Fixed

- **native:** give the packaged domain apps root-relative addresses
- **android:** go back with the back button instead of closing the app
- **theme:** write buttons and segments as sentences, as the prototype does

### Changed

- **remotes:** one shell session for React and Angular domain apps

### Documentation

- **readme:** explain the shell and the contract of the react domain apps
- **readme:** explain how to package and run the Android app
- **readme:** point the header to Barber Saas and barber-saas-docs

### Tests

- **http:** cover the envelope, timeouts, credentials and validation errors
- **session:** cover persistence, expiry and listeners of the session
- **http:** cover headers, errors, 401, network failures and non-api urls
- **ci:** install exactly what was tested and run the unit tests
- **ci:** build the shell and its federation artefacts on every pull request
- **session:** specify a client session bound to a barbershop
- **http:** specify the gateway address of the packaged app
- **navigation:** specify the Avisos tab of every role

### Maintenance

- **front:** ignore dependencies, builds and generated federation files
- **github:** add the pull request template
- **github:** track the story environment on the board
- **env:** state that the front end holds no secrets
- **build:** pin angular 21, ionic 8, capacitor 7 and vitest with a lock file
- **build:** configure the angular workspace with the native federation builder and ionic styles
- **git:** never version the Firebase files
- refuse Firebase files and keys in any pull request
- skip the workflow's own pattern and print only file names

[2.0.0]: https://github.com/code-corhuila/barber-saas-front/releases/tag/v2.0.0
