import { Routes } from '@angular/router';
import { authGuard, welcomeGuard } from './core/auth/auth.guard';
import { ReactRemoteHostComponent } from './core/remotes/react-remote-host.component';

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

export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Inicio', canActivate: [welcomeGuard], loadComponent: () =>
      import('./layout/home.component').then((m) => m.HomeComponent) },
  { path: 'profile', title: 'Perfil', canActivate: [authGuard], loadComponent: () =>
      import('./layout/profile.component').then((m) => m.ProfileComponent) },
  reactDomain('sign-in', 'identity-auth', 'Ingresar', false),
  reactDomain('barbershops', 'barbershop', 'Barberías'),
  reactDomain('schedule', 'schedule', 'Horarios'),
  reactDomain('appointments', 'appointment', 'Citas'),
  { path: '**', title: 'Página no encontrada', loadComponent: () =>
      import('./layout/not-found.component').then((m) => m.NotFoundComponent) },
];
