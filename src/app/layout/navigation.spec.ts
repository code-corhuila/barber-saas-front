import { describe, expect, it } from 'vitest';
import { homeFor, tabsFor } from './navigation';

describe('navigation', () => {
  it('gives each role the prototype tabs, profile last', () => {
    expect(tabsFor('CLIENT').map((t) => t.label)).toEqual(['Buscar', 'Mis citas', 'Avisos', 'Perfil']);
    expect(tabsFor('BARBER').map((t) => t.label)).toEqual(['Mi agenda', 'Horarios', 'Avisos', 'Perfil']);
    expect(tabsFor('ADMIN_BARBERSHOP').map((t) => t.label)).toEqual(['Agenda', 'Mi barbería', 'Horarios', 'Avisos', 'Perfil']);
    expect(tabsFor('SUPER_ADMIN').map((t) => t.label)).toEqual(['Plataforma', 'Avisos', 'Perfil']);
  });

  it('opens the inbox of every role from the same tab', () => {
    for (const role of ['CLIENT', 'BARBER', 'ADMIN_BARBERSHOP', 'SUPER_ADMIN'] as const) {
      expect(tabsFor(role).find((t) => t.label === 'Avisos')?.path).toBe('/notifications');
    }
  });

  it('has no tabs without a session', () => {
    expect(tabsFor(undefined)).toEqual([]);
  });

  it('lands each role on its first tab', () => {
    expect(homeFor('CLIENT')).toBe('/barbershops');
    expect(homeFor('BARBER')).toBe('/appointments');
    expect(homeFor('SUPER_ADMIN')).toBe('/platform');
  });
});
