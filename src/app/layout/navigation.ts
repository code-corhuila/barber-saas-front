import { SessionUser } from '../core/session/session-store';

export interface NavigationItem {
  path: string;
  label: string;
  description: string;
  roles: SessionUser['role'][];
}

/** The sections each role may open. The services enforce the same rules; this only hides links. */
export const NAVIGATION: NavigationItem[] = [
  { path: '/barbershops', label: 'Barberías', description: 'Busca una barbería, sus servicios y sus barberos',
    roles: ['CLIENT', 'ADMIN_BARBERSHOP'] },
  { path: '/appointments', label: 'Citas', description: 'Reserva, consulta y cancela citas',
    roles: ['CLIENT', 'BARBER', 'ADMIN_BARBERSHOP'] },
  { path: '/schedule', label: 'Horarios', description: 'Horarios y excepciones de los barberos',
    roles: ['BARBER', 'ADMIN_BARBERSHOP'] },
];
