import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SessionService } from '../core/auth/session.service';
import { apiClient, type ApiError } from '../core/http/api-client';
import { sessionStore } from '../core/session/session-store';
import { accountApi } from './account-api';
import { ACCOUNT_STYLES } from './account.styles';

/** HU-AUTH-006: the user edits their name and phone; the e-mail and the role never change here. */
@Component({
  selector: 'bs-edit-profile',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <a class="back" routerLink="/profile">‹ Perfil</a>
      <h1>Editar perfil</h1>
      <form class="card" (ngSubmit)="save()">
        <label for="fullName">Nombre completo</label>
        <input id="fullName" name="fullName" autocomplete="name" [(ngModel)]="fullName" maxlength="120" required />
        <label for="phone">Teléfono (opcional)</label>
        <input id="phone" name="phone" type="tel" autocomplete="tel" [(ngModel)]="phone" maxlength="20" />
        <label for="email">Correo electrónico</label>
        <input id="email" name="email" [value]="session.user()?.email" disabled />
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        @if (saved()) { <p class="ok" role="status">Tus datos quedaron guardados.</p> }
        <button class="primary" type="submit" [disabled]="pending()">{{ pending() ? 'Guardando…' : 'Guardar' }}</button>
      </form>
    </section>
  `,
  styles: ACCOUNT_STYLES,
})
export class EditProfileComponent {
  readonly session = inject(SessionService);
  fullName = this.session.user()?.fullName ?? '';
  phone = this.session.user()?.phone ?? '';
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  async save(): Promise<void> {
    this.saved.set(false);
    this.error.set(null);
    if (!this.fullName.trim()) {
      this.error.set('Escribe tu nombre.');
      return;
    }
    this.pending.set(true);
    try {
      sessionStore.updateUser(await accountApi.updateMe(apiClient, this.fullName, this.phone));
      this.saved.set(true);
    } catch (err) {
      this.error.set((err as ApiError).userMessage ?? 'No se pudieron guardar tus datos.');
    } finally {
      this.pending.set(false);
    }
  }
}
