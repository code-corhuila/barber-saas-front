import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { SessionService } from '../core/auth/session.service';
import { ROLE_BADGE } from './navigation';

/** The prototype's profile tab: the user's initial, name, email and role, and signing out. */
@Component({
  selector: 'bs-profile',
  imports: [IonIcon],
  template: `
    @if (session.user(); as user) {
      <header class="header">
        <div class="avatar" aria-hidden="true">{{ user.fullName.charAt(0).toUpperCase() }}</div>
        <h1>{{ user.fullName }}</h1>
        <p class="email">{{ user.email }}</p>
        <span class="badge" [style.color]="badge().color" [style.border-color]="badge().color">{{ badge().label }}</span>
      </header>
      <section class="content">
        <button type="button" class="row danger" (click)="signOut()">
          <ion-icon name="log-out" aria-hidden="true" /> Cerrar sesión
        </button>
      </section>
    }
  `,
  styles: `
    .header { display: flex; flex-direction: column; align-items: center; padding: 50px 20px 24px;
              background: linear-gradient(#2a2416, var(--bs-bg)); }
    .avatar { width: 96px; height: 96px; border-radius: 50%; background: var(--bs-card); border: 3px solid var(--bs-gold);
              display: grid; place-items: center; color: var(--bs-gold); font-size: 36px; font-weight: 700;
              margin-bottom: 14px; }
    h1 { font-size: 21px; font-weight: 700; margin: 0; text-align: center; }
    .email { color: #aaa; font-size: 13px; margin: 3px 0 0; }
    .badge { margin-top: 12px; border: 1px solid; border-radius: 20px; padding: 5px 14px; font-size: 12px;
             font-weight: 700; letter-spacing: .5px; }
    .content { padding: 20px 16px 16px; max-width: 40rem; margin: 0 auto; }
    .row { width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px 16px;
           background: var(--bs-card); border: 1px solid var(--bs-border); border-radius: 10px; font: inherit;
           font-size: 14px; font-weight: 600; color: var(--bs-text); cursor: pointer; }
    .row ion-icon { font-size: 20px; }
    .row.danger { border-color: #3a1e1e; color: var(--bs-danger); }
  `,
})
export class ProfileComponent {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);
  readonly badge = computed(() => ROLE_BADGE[this.session.user()?.role ?? 'CLIENT']);

  signOut(): void {
    this.session.signOut();
    void this.router.navigateByUrl('/');
  }
}
