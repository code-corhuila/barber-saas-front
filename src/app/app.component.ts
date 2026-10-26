import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IonApp, IonContent, IonFooter, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  business, calendar, card, create, cut, gift, heart, key, logOut, notifications, person, search, star, statsChart,
  time,
} from 'ionicons/icons';
import { filter, map } from 'rxjs';
import { SessionService } from './core/auth/session.service';
import { PlanService } from './account/plan.service';
import { apiClient } from './core/http/api-client';
import { listenToBackButton } from './core/native/back-button';
import { devicePush, pushAvailable } from './core/native/push';
import { tabsFor } from './layout/navigation';

/**
 * The frame of the app, as in the prototype: the bottom tabs of the user's role under the domain
 * area, whose screens carry their own titles. Signed out, the screens use the whole page.
 */
@Component({
  selector: 'app-root',
  imports: [IonApp, IonContent, IonFooter, IonIcon, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <ion-app>
      <ion-content [class.framed]="framed()">
        @if (planBanner(); as b) {
          <a class="plan-banner" [class.blocked]="b.blocked" routerLink="/profile/plan">{{ b.text }} <strong>Pagar plan ›</strong></a>
        }
        <main><router-outlet /></main>
      </ion-content>
      @if (framed()) {
        <ion-footer class="ion-no-border">
          <nav class="tabs" aria-label="Secciones">
            @for (tab of tabs(); track tab.label) {
              <a class="tab" [routerLink]="tab.path" routerLinkActive="active" ariaCurrentWhenActive="page">
                <ion-icon [name]="tab.icon" aria-hidden="true" />
                <span>{{ tab.label }}</span>
              </a>
            }
          </nav>
        </ion-footer>
      }
    </ion-app>
  `,
  styles: `
    /* The domain apps pin their action bar (e.g. "Continuar") with position: fixed; bottom: 0. A
       transform makes ion-content their containing block, so the bar sits above the tabs. */
    ion-content.framed { transform: translateZ(0); }
    .tabs { display: flex; background: var(--bs-bg); border-top: 1px solid var(--bs-border);
            padding-bottom: env(safe-area-inset-bottom); }
    .tab { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 0 8px;
           color: var(--bs-muted); text-decoration: none; font-size: 11px; }
    .tab ion-icon { font-size: 24px; }
    .tab.active { color: var(--bs-gold); }
    .plan-banner { display: block; background: #3a2f12; color: #ffdd88; padding: 10px 16px; font-size: 13px;
                   text-decoration: none; text-align: center; }
    .plan-banner.blocked { background: #3a1414; color: #ffb3b3; }
    .plan-banner strong { color: var(--bs-gold); margin-left: 6px; }
  `,
})
export class AppComponent {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map((e) => e.urlAfterRedirects)),
    { initialValue: this.router.url },
  );

  readonly tabs = computed(() => tabsFor(this.session.user()?.role));
  private readonly plans = inject(PlanService);

  /** HU-SHOP-003: the owner sees the last week of the trial or paid month, and a suspended barbershop. */
  readonly planBanner = computed(() => {
    const state = this.plans.state();
    if (!state?.warn || !this.framed() || this.url().startsWith('/profile/plan')) return null;
    if (state.blocked) return { blocked: true, text: 'Plan vencido: tu barbería no está recibiendo reservas.' };
    const left = state.daysLeft === 1 ? '1 día' : `${state.daysLeft} días`;
    const what = this.plans.subscription()?.status === 'TRIAL' ? 'de prueba gratis' : 'de tu plan';
    return { blocked: false, text: `Te quedan ${left} ${what}.` };
  });
  /** The tabs show only to a signed-in user outside the sign-in screens. */
  readonly framed = computed(() => this.session.signedIn() && !this.url().startsWith('/sign-in'));

  constructor() {
    addIcons({
      business, calendar, card, create, cut, gift, heart, key, logOut, notifications, person, search, star,
      'stats-chart': statsChart, time,
    });
    listenToBackButton();
    if (pushAvailable()) {
      // Each sign-in registers this device for whoever is using it now (F-4).
      const push = devicePush(apiClient, () => void this.router.navigateByUrl('/notifications'));
      let registeredFor: string | null = null;
      effect(() => {
        const userId = this.session.user()?.id ?? null;
        if (userId && userId !== registeredFor) {
          registeredFor = userId;
          void push.enable();
        } else if (!userId) {
          registeredFor = null;
        }
      });
    }
  }
}
