import { loadRemoteModule } from '@angular-architects/native-federation';
import { Routes } from '@angular/router';
import { authGuard, roleGuard, welcomeGuard } from './core/auth/auth.guard';
import { remoteUnavailable } from './core/errors/remote-unavailable.component';
import { ReactRemoteHostComponent } from './core/remotes/react-remote-host.component';
import { shellContextResolver } from './core/remotes/shell-context';
import type { SessionUser } from './core/session/session-store';

/**
 * One entry per domain app. An Ionic React domain app is mounted by ReactRemoteHostComponent;
 * an Ionic Angular domain app exposes its routes as './routes' and is loaded with
 * loadRemoteModule(...).catch(remoteUnavailable). Each owner adds only the entry of their domain,
 * in a small pull request opened right after `git pull`.
 */
function reactDomain(path: string, remote: string, title: string, guarded = true): Routes[number] {
  return {
    path,
    title,
    canActivate: guarded ? [authGuard] : [],
    children: [{
      path: '**',
      component: ReactRemoteHostComponent,
      data: { remote, title, basePath: `/${path}` },
    }],
  };
}

/**
 * An Ionic Angular domain app: its './routes' run in the shell's injector, with the shell's
 * HttpClient, and get the session as `data.shell` (ShellContext). Only the given roles open it.
 */
function angularDomain(path: string, remote: string, title: string, roles: SessionUser['role'][]): Routes[number] {
  return {
    path,
    title,
    canActivate: [authGuard, roleGuard(...roles)],
    resolve: { shell: shellContextResolver },
    loadChildren: () => loadRemoteModule(remote, './routes')
      .then((m: { routes: Routes }) => m.routes)
      .catch((err: unknown) => remoteUnavailable(title, err)),
  };
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Inicio', canActivate: [welcomeGuard], loadComponent: () =>
      import('./layout/home.component').then((m) => m.HomeComponent) },
  { path: 'profile', title: 'Perfil', canActivate: [authGuard], loadComponent: () =>
      import('./layout/profile.component').then((m) => m.ProfileComponent) },
  reactDomain('sign-in', 'identity-auth', 'Ingresar', false),
  reactDomain('barbershops', 'barbershop', 'Barberías'),
  reactDomain('schedule', 'schedule', 'Horarios'),
  reactDomain('appointments', 'appointment', 'Citas'),
  angularDomain('platform', 'platform-admin', 'Plataforma', ['SUPER_ADMIN']),
  angularDomain('notifications', 'notifications', 'Notificaciones', ['CLIENT', 'BARBER', 'ADMIN_BARBERSHOP', 'SUPER_ADMIN']),
  { path: '**', title: 'Página no encontrada', loadComponent: () =>
      import('./layout/not-found.component').then((m) => m.NotFoundComponent) },
];
