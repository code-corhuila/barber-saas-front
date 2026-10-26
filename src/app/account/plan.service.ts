import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { SessionService } from '../core/auth/session.service';
import { apiClient } from '../core/http/api-client';
import { accountApi, planState, type Subscription } from './account-api';

/**
 * The owner's subscription (HU-SHOP-003), read once per sign-in and again after a payment, so the
 * profile card, the home banner and the "Plan vencido" notice show the same state.
 */
@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly session = inject(SessionService);
  private readonly current = signal<Subscription | null>(null);

  readonly subscription = this.current.asReadonly();
  readonly state = computed(() => (this.current() ? planState(this.current()!) : null));

  constructor() {
    effect(() => {
      const user = this.session.user();
      if (user?.role === 'ADMIN_BARBERSHOP') {
        void this.reload();
      } else {
        this.current.set(null);
      }
    });
  }

  async reload(): Promise<void> {
    try {
      this.current.set(await accountApi.subscription(apiClient));
    } catch {
      // Without an answer the card and the banner stay hidden; the screens that need it show the error.
    }
  }
}
