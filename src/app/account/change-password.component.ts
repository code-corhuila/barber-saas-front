import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiClient, type ApiError } from '../core/http/api-client';
import { sessionStore } from '../core/session/session-store';
import { accountApi } from './account-api';
import { ACCOUNT_STYLES } from './account.styles';

/** The password rule of identity-auth (PasswordPolicy): 8 characters, one capital letter and one number. */
const STRONG = /^(?=.*[A-Z])(?=.*\d).{8,100}$/;

/** HU-AUTH-006: a new password with the current one; every other session of the user is closed. */
@Component({
  selector: 'bs-change-password',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="page">
      <a class="back" routerLink="/profile">‹ Perfil</a>
      <h1>Cambiar contraseña</h1>
      <form class="card" (ngSubmit)="save()">
        <label for="current">Contraseña actual</label>
        <input id="current" name="current" type="password" autocomplete="current-password" [(ngModel)]="current" />
        <label for="next">Nueva contraseña</label>
        <input id="next" name="next" type="password" autocomplete="new-password" [(ngModel)]="next"
               placeholder="Mín. 8 caracteres, 1 mayúscula y 1 número" />
        <label for="repeat">Repite la nueva contraseña</label>
        <input id="repeat" name="repeat" type="password" autocomplete="new-password" [(ngModel)]="repeat" />
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        @if (saved()) { <p class="ok" role="status">Listo. Cerramos tus otras sesiones abiertas.</p> }
        <button class="primary" type="submit" [disabled]="pending()">
          {{ pending() ? 'Cambiando…' : 'Cambiar contraseña' }}
        </button>
      </form>
    </section>
  `,
  styles: ACCOUNT_STYLES,
})
export class ChangePasswordComponent {
  current = '';
  next = '';
  repeat = '';
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);

  async save(): Promise<void> {
    this.saved.set(false);
    this.error.set(null);
    if (!this.current) return this.error.set('Escribe tu contraseña actual.');
    if (!STRONG.test(this.next)) return this.error.set('La nueva contraseña necesita 8 caracteres, una mayúscula y un número.');
    if (this.next !== this.repeat) return this.error.set('Las contraseñas nuevas no coinciden.');
    this.pending.set(true);
    try {
      await accountApi.changePassword(apiClient, this.current, this.next, sessionStore.get()?.refreshToken);
      this.saved.set(true);
      this.current = this.next = this.repeat = '';
    } catch (err) {
      const e = err as ApiError;
      this.error.set(e.status === 422 ? 'La contraseña actual no es correcta.' : e.userMessage ?? 'No se pudo cambiar.');
    } finally {
      this.pending.set(false);
    }
  }
}
