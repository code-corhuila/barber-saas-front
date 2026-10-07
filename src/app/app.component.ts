import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IonApp, IonContent, IonFooter, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { business, calendar, cut, logOut, notifications, person, search, time } from 'ionicons/icons';
import { filter, map } from 'rxjs';
import { SessionService } from './core/auth/session.service';
import { listenToBackButton } from './core/native/back-button';
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
  /** The tabs show only to a signed-in user outside the sign-in screens. */
  readonly framed = computed(() => this.session.signedIn() && !this.url().startsWith('/sign-in'));

  constructor() {
    addIcons({ business, calendar, cut, logOut, notifications, person, search, time });
    listenToBackButton();
  }
}
