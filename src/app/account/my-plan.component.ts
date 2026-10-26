import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiClient, type ApiError } from '../core/http/api-client';
import {
  accountApi, barberLimit, money, PAYMENT_LABEL, shortDate, type Payment, type Plan,
} from './account-api';
import { ACCOUNT_STYLES } from './account.styles';
import { PlanService } from './plan.service';

/**
 * HU-SHOP-003 and HU-SADMIN-003: the owner sees the plan, the trial or paid month left and the
 * payments, and pays a plan in Wompi's checkout (sandbox, no real money, ADR-017). The plan becomes
 * active when Wompi confirms it, so the screen reloads when the owner comes back to it.
 */
@Component({
  selector: 'bs-my-plan',
  imports: [RouterLink],
  template: `
    <section class="page">
      <a class="back" routerLink="/profile">‹ Perfil</a>
      <h1>Mi plan</h1>

      @if (plans.subscription(); as s) {
        <div class="card plan" [class.blocked]="state()?.blocked">
          <div class="row">
            <strong class="name">{{ s.plan?.name ?? 'Sin plan' }}</strong>
            <span class="badge">{{ state()?.label }}</span>
          </div>
          @if (s.plan) {
            <p class="price gold">{{ money(s.plan.priceCents) }} / mes</p>
            <p class="muted">{{ barberLimit(s.plan.maxBarbers) }}</p>
          }
          @if (state(); as st) {
            @if (st.blocked) {
              <p class="warn">Tu barbería no está recibiendo reservas. Paga tu plan para reactivarla.</p>
            } @else if (st.daysLeft !== null && st.endsAt) {
              <p [class.warn]="st.warn">
                {{ s.status === 'TRIAL' ? 'Te quedan' : 'Tu mes pagado vence en' }} {{ st.daysLeft }}
                {{ st.daysLeft === 1 ? 'día' : 'días' }}{{ s.status === 'TRIAL' ? ' de prueba gratis' : '' }}
                (vence el {{ shortDate(st.endsAt) }})
              </p>
            }
          }
        </div>
      } @else if (loadError()) {
        <p class="error" role="alert">{{ loadError() }}</p>
      }

      <h2>Elige o renueva tu plan</h2>
      <p class="muted">El pago se hace en Wompi en modo de prueba: usa las tarjetas de prueba, no se cobra dinero real.</p>
      @for (p of available(); track p.id) {
        <button type="button" class="card option" [class.on]="p.id === chosen()" (click)="chosen.set(p.id)">
          <span class="row"><strong>{{ p.name }}</strong><span class="gold">{{ money(p.priceCents) }} / mes</span></span>
          <span class="muted">{{ barberLimit(p.maxBarbers) }}</span>
        </button>
      }
      @if (payError()) { <p class="error" role="alert">{{ payError() }}</p> }
      <button class="primary" type="button" [disabled]="!chosen() || paying()" (click)="pay()">
        {{ paying() ? 'Abriendo el pago…' : 'Pagar plan' }}
      </button>

      <h2>Mis pagos</h2>
      @for (p of payments(); track p.id) {
        <div class="card row">
          <span>{{ p.planName }}<br /><span class="muted">{{ shortDate(p.createdAt) }}</span></span>
          <span class="right">{{ money(p.amountCents) }}<br />
            <span class="status" [class.approved]="p.status === 'APPROVED'">{{ label[p.status] }}</span></span>
        </div>
      } @empty {
        <p class="muted">Todavía no tienes pagos.</p>
      }
    </section>
  `,
  styles: ACCOUNT_STYLES + `
    .plan .name { font-size: 18px; }
    .plan.blocked { border-color: var(--bs-danger); }
    .badge { border: 1px solid var(--bs-gold); color: var(--bs-gold); border-radius: 20px; padding: 3px 10px;
             font-size: 12px; font-weight: 700; }
    .price { font-size: 18px; font-weight: 700; margin: 8px 0 2px; }
    .warn { color: #ffcc66; }
    .option { display: block; width: 100%; text-align: left; color: var(--bs-text); font: inherit; cursor: pointer; }
    .option.on { border-color: var(--bs-gold); }
    .right { text-align: right; }
    .status { font-size: 12px; color: var(--bs-muted); }
    .status.approved { color: #8fd18f; }
  `,
})
export class MyPlanComponent implements OnInit, OnDestroy {
  readonly plans = inject(PlanService);
  readonly state = this.plans.state;
  readonly catalog = signal<Plan[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly chosen = signal<string | null>(null);
  readonly paying = signal(false);
  readonly payError = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly available = computed(() => this.catalog().filter((p) => p.isActive));
  readonly label = PAYMENT_LABEL;
  readonly money = money;
  readonly barberLimit = barberLimit;
  readonly shortDate = shortDate;
  /** The same key while the owner retries the same plan; a new one for another plan. */
  private key = { planId: '', value: '' };

  /** Back from Wompi's checkout (another app or tab): read the result again. */
  private readonly onVisible = () => {
    if (document.visibilityState === 'visible') void this.load();
  };

  ngOnInit(): void {
    void this.load();
    document.addEventListener('visibilitychange', this.onVisible);
  }

  ngOnDestroy(): void {
    document.removeEventListener('visibilitychange', this.onVisible);
  }

  async load(): Promise<void> {
    await this.plans.reload();
    if (!this.plans.subscription()) this.loadError.set('No pudimos leer tu plan. Inténtalo de nuevo.');
    try {
      const [catalog, payments] = await Promise.all([accountApi.plans(apiClient), accountApi.payments(apiClient)]);
      this.catalog.set(catalog);
      this.payments.set(payments);
      this.chosen.update((c) => c ?? this.plans.subscription()?.plan?.id ?? null);
    } catch (err) {
      this.loadError.set((err as ApiError).userMessage ?? 'No pudimos leer los planes.');
    }
  }

  async pay(): Promise<void> {
    const planId = this.chosen();
    if (!planId) return;
    if (this.key.planId !== planId) this.key = { planId, value: crypto.randomUUID() };
    this.payError.set(null);
    this.paying.set(true);
    try {
      const { checkoutUrl } = await accountApi.startPayment(apiClient, planId, this.key.value);
      this.key = { planId: '', value: '' };
      window.open(checkoutUrl, '_blank');
    } catch (err) {
      this.payError.set((err as ApiError).userMessage ?? 'No se pudo iniciar el pago.');
    } finally {
      this.paying.set(false);
    }
  }
}
