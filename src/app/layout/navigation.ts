import { SessionUser } from '../core/session/session-store';

type Role = SessionUser['role'];

export interface NavigationItem {
  path: string;
  label: string;
  /** An Ionicons name, registered in AppComponent. */
  icon: string;
  roles: Role[];
}

/**
 * The bottom tabs of each role, as in the prototype. One tab per domain app: the app keeps its own
 * sections inside. The services enforce the same rules; this only hides links.
 */
export const NAVIGATION: NavigationItem[] = [
  { path: '/barbershops', label: 'Buscar', icon: 'search', roles: ['CLIENT'] },
  { path: '/appointments', label: 'Mis citas', icon: 'calendar', roles: ['CLIENT'] },
  { path: '/appointments', label: 'Mi agenda', icon: 'calendar', roles: ['BARBER'] },
  { path: '/appointments', label: 'Agenda', icon: 'calendar', roles: ['ADMIN_BARBERSHOP'] },
  { path: '/barbershops', label: 'Mi barbería', icon: 'cut', roles: ['ADMIN_BARBERSHOP'] },
  { path: '/schedule', label: 'Horarios', icon: 'time', roles: ['BARBER', 'ADMIN_BARBERSHOP'] },
  { path: '/platform', label: 'Plataforma', icon: 'business', roles: ['SUPER_ADMIN'] },
  { path: '/profile', label: 'Perfil', icon: 'person', roles: ['CLIENT', 'BARBER', 'ADMIN_BARBERSHOP', 'SUPER_ADMIN'] },
];

export function tabsFor(role: Role | undefined): NavigationItem[] {
  return role ? NAVIGATION.filter((item) => item.roles.includes(role)) : [];
}

/** Where a signed-in user lands: their first tab. */
export function homeFor(role: Role | undefined): string {
  return tabsFor(role)[0]?.path ?? '/profile';
}

/** The label and badge colour of each role on the profile, as in the prototype. */
export const ROLE_BADGE: Record<Role, { label: string; color: string }> = {
  CLIENT: { label: 'Cliente', color: '#4caf50' },
  BARBER: { label: 'Barbero', color: '#2196f3' },
  ADMIN_BARBERSHOP: { label: 'Administrador', color: '#d4af37' },
  SUPER_ADMIN: { label: 'Super administrador', color: '#9c27b0' },
};
