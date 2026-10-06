import { describe, expect, it } from 'vitest';
import { homeFor, tabsFor } from './navigation';

describe('navigation', () => {
  it('gives each role the prototype tabs, profile last', () => {
    expect(tabsFor('CLIENT').map((t) => t.label)).toEqual(['Buscar', 'Mis citas', 'Perfil']);
    expect(tabsFor('BARBER').map((t) => t.label)).toEqual(['Mi agenda', 'Horarios', 'Perfil']);
    expect(tabsFor('ADMIN_BARBERSHOP').map((t) => t.label)).toEqual(['Agenda', 'Mi barbería', 'Horarios', 'Perfil']);
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
