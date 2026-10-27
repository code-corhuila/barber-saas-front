import { describe, expect, it } from 'vitest';
import { barberLimit, checkoutHref, money, planState, type Subscription } from './account-api';

const base: Subscription = {
  barbershopId: 'b', status: 'TRIAL', plan: null, trialEndsAt: '2026-11-20T15:00:00Z', paidUntil: null,
};
const now = new Date('2026-10-27T15:00:00Z');

describe('planState', () => {
  it('counts the days left of the trial and warns only in the last week', () => {
    expect(planState(base, now)).toMatchObject({ label: 'Prueba gratis', daysLeft: 24, warn: false, blocked: false });
    expect(planState({ ...base, trialEndsAt: '2026-11-02T15:00:00Z' }, now)).toMatchObject({ daysLeft: 6, warn: true });
  });

  it('counts the paid month of an active barbershop', () => {
    const active = { ...base, status: 'ACTIVE' as const, paidUntil: '2026-10-28T10:00:00Z' };
    expect(planState(active, now)).toMatchObject({ label: 'Activa', daysLeft: 1, warn: true });
    expect(planState({ ...active, paidUntil: null }, now)).toMatchObject({ daysLeft: null, warn: false });
  });

  it('marks a suspended barbershop as blocked', () => {
    expect(planState({ ...base, status: 'SUSPENDED' }, now)).toMatchObject({ label: 'Suspendida', warn: true, blocked: true });
  });
});

describe('formats', () => {
  it('shows COP without cents and the unlimited plan', () => {
    expect(money(4_990_000).replace(/\s/g, '')).toMatch(/^\$49[.,]900$/);
    expect(barberLimit(2)).toBe('Hasta 2 barberos');
    expect(barberLimit(999)).toBe('Barberos ilimitados');
  });
});

describe('checkoutHref', () => {
  it('completes the simulated checkout with the gateway and keeps Wompi as it is', () => {
    expect(checkoutHref('/api/v1/payments/simulator/BS-1', 'http://10.0.2.2:8000'))
      .toBe('http://10.0.2.2:8000/api/v1/payments/simulator/BS-1');
    expect(checkoutHref('https://checkout.wompi.co/p/?x=1', 'http://gw')).toBe('https://checkout.wompi.co/p/?x=1');
  });
});
