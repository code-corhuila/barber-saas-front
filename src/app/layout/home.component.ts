import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/angular/standalone';
import { SessionService } from '../core/auth/session.service';
import { NAVIGATION } from './navigation';

@Component({
  selector: 'bs-home',
  imports: [RouterLink, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton],
  template: `
    <section class="home">
      @if (session.user(); as user) {
        <h1>Hola, {{ user.fullName }}</h1>
        @for (item of sections(); track item.path) {
          <ion-card [routerLink]="item.path" button>
            <ion-card-header><ion-card-title>{{ item.label }}</ion-card-title></ion-card-header>
            <ion-card-content>{{ item.description }}</ion-card-content>
          </ion-card>
        } @empty {
          <p>Todavía no hay secciones disponibles para tu perfil.</p>
        }
      } @else {
        <h1>Bienvenido a BarberSaaS</h1>
        <p>Reserva tu cita en tu barbería favorita.</p>
        <ion-button routerLink="/sign-in" expand="block">Ingresar o crear una cuenta</ion-button>
      }
    </section>
  `,
  styles: `.home { max-width: 40rem; margin: 0 auto; padding: 1rem; }`,
})
export class HomeComponent {
  readonly session = inject(SessionService);
  readonly sections = computed(() => {
    const role = this.session.user()?.role;
    return role ? NAVIGATION.filter((item) => item.roles.includes(role)) : [];
  });
}
