import type { ApiClient } from '../core/http/api-client';
import type { SessionUser } from '../core/session/session-store';

/** A plan of platform-admin-service.yaml (SubscriptionPlan). */
export interface Plan {
  id: string;
  name: string;
  priceCents: number;
  maxBarbers: number;
  isActive: boolean;
}

/** GET /api/v1/subscription (HU-SHOP-003). */
export interface Subscription {
  barbershopId: string;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
  plan: Plan | null;
  trialEndsAt: string;
  paidUntil: string | null;
}

/** One row of GET /api/v1/payments (HU-SADMIN-003). */
export interface Payment {
  id: string;
  planName: string;
  amountCents: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';
  createdAt: string;
  periodEnd: string | null;
}

interface PageOf<T> {
  data: T[];
}

/** The calls of the account screens, always through the shell's one client. */
export const accountApi = {
  updateMe: (api: ApiClient, fullName: string, phone: string | null) =>
    api.patch<SessionUser>('/api/v1/auth/me', { fullName: fullName.trim(), phone: phone?.trim() || null }),
  changePassword: (api: ApiClient, currentPassword: string, newPassword: string, refreshToken?: string) =>
    api.post<void>('/api/v1/auth/me/password', { currentPassword, newPassword, ...(refreshToken ? { refreshToken } : {}) }),
  subscription: (api: ApiClient) => api.get<Subscription>('/api/v1/subscription'),
  plans: async (api: ApiClient) => (await api.get<PageOf<Plan>>('/api/v1/plans?limit=100')).data,
  payments: async (api: ApiClient) => (await api.get<PageOf<Payment>>('/api/v1/payments?limit=50')).data,
  startPayment: (api: ApiClient, planId: string, idempotencyKey: string) =>
    api.post<{ checkoutUrl: string; payment: Payment }>('/api/v1/payments', { planId }, { idempotencyKey }),
};

const DAY_MS = 24 * 3600 * 1000;

/** What the "Mi plan" card and the banner say about the barbershop's subscription, at {@code now}. */
export interface PlanState {
  /** Prueba gratis, Activa, Suspendida… */
  label: string;
  /** Whole days left of the trial or the paid month; null when there is no end to count. */
  daysLeft: number | null;
  endsAt: Date | null;
  /** Show the warning: 7 days or fewer left, or suspended. */
  warn: boolean;
  /** Suspended or cancelled: clients cannot book (HU-APPT-004). */
  blocked: boolean;
}

export function planState(s: Subscription, now: Date = new Date()): PlanState {
  const end = s.status === 'TRIAL' ? s.trialEndsAt : s.status === 'ACTIVE' ? s.paidUntil : null;
  const endsAt = end ? new Date(end) : null;
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS)) : null;
  const blocked = s.status === 'SUSPENDED' || s.status === 'CANCELLED';
  const label = { TRIAL: 'Prueba gratis', ACTIVE: 'Activa', SUSPENDED: 'Suspendida', CANCELLED: 'Cancelada' }[s.status];
  return { label, daysLeft, endsAt, warn: blocked || (daysLeft !== null && daysLeft <= 7), blocked };
}

/**
 * Wompi's checkout is absolute; the simulated checkout of DEC-PLAT-08 is a gateway path, completed with
 * the gateway this app already uses (laptop, emulator or deployed host).
 */
export function checkoutHref(checkoutUrl: string, gateway: string): string {
  return checkoutUrl.startsWith('/') ? gateway + checkoutUrl : checkoutUrl;
}

/** COP from cents: 4990000 → "$49.900". */
export function money(cents: number): string {
  return '$' + Math.round(cents / 100).toLocaleString('es-CO');
}

/** 999 barbers is the seed's "unlimited" (06-data/models.md §9). */
export function barberLimit(maxBarbers: number): string {
  return maxBarbers >= 999 ? 'Barberos ilimitados' : `Hasta ${maxBarbers} barberos`;
}

export function shortDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const PAYMENT_LABEL: Record<Payment['status'], string> = {
  PENDING: 'Pendiente', APPROVED: 'Aprobado', DECLINED: 'Rechazado', VOIDED: 'Anulado', ERROR: 'Con error',
};
