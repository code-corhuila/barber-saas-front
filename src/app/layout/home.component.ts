import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The prototype's welcome screen, for a visitor without a session; a signed-in user never sees it. */
@Component({
  selector: 'bs-home',
  imports: [RouterLink],
  template: `
    <section class="welcome">
      <div class="brand">
        <div class="logo" aria-hidden="true">💈</div>
        <h1>BarberSaaS</h1>
        <p class="tagline">La forma más fácil de gestionar tu barbería o reservar tu próximo corte.</p>
      </div>

      <ul class="features">
        <li><span aria-hidden="true">📅</span>Reserva citas en segundos</li>
        <li><span aria-hidden="true">✂️</span>Gestiona tu equipo y agenda</li>
        <li><span aria-hidden="true">🎁</span>Programa de fidelidad para tus clientes</li>
      </ul>

      <div class="actions">
        <a class="primary" routerLink="/sign-in">Iniciar sesión</a>
        <a class="secondary" routerLink="/sign-in/register">Crear cuenta</a>
        <a class="owner" routerLink="/sign-in/register-owner">¿Tienes una barbería? <strong>Regístrala gratis</strong></a>
      </div>
    </section>
  `,
  styles: `
    .welcome { min-height: 100dvh; max-width: 30rem; margin: 0 auto; padding: 24px; box-sizing: border-box;
               display: flex; flex-direction: column; justify-content: space-between; gap: 32px; }
    .brand { text-align: center; margin-top: 40px; }
    .logo { width: 88px; height: 88px; border-radius: 50%; background: var(--bs-card); border: 2px solid var(--bs-gold);
            display: grid; place-items: center; font-size: 40px; margin: 0 auto 16px; }
    h1 { font-size: 28px; font-weight: 800; letter-spacing: .5px; margin: 0; }
    .tagline { color: var(--bs-muted); font-size: 14px; line-height: 20px; margin: 10px 20px 0; }
    .features { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
    .features li { display: flex; align-items: center; gap: 12px; background: var(--bs-card); border-radius: 12px;
                   padding: 14px; color: #ddd; font-size: 14px; }
    .features span { font-size: 22px; }
    .actions { display: grid; gap: 12px; margin-bottom: 12px; }
    .primary, .secondary { display: block; text-align: center; border-radius: 10px; padding: 16px; font-weight: 700;
                           font-size: 16px; text-decoration: none; }
    .primary { background: var(--bs-gold); color: var(--bs-bg); }
    .secondary { border: 1px solid #3a3a3a; color: var(--bs-text); }
    .owner { text-align: center; color: var(--bs-muted); font-size: 14px; text-decoration: none; margin-top: 4px; }
    .owner strong { color: var(--bs-gold); }
  `,
})
export class HomeComponent {}
