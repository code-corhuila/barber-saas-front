import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { IonApp, IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { SessionService } from './core/auth/session.service';
import { NAVIGATION } from './layout/navigation';

/** The frame of the app: title bar, the sections the user's role may open, and the domain area. */
@Component({
  selector: 'app-root',
  imports: [IonApp, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, RouterOutlet, RouterLink],
  template: `
    <ion-app>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title><a routerLink="/" class="brand">BarberSaaS</a></ion-title>
          <ion-buttons slot="end">
            @for (item of sections(); track item.path) {
              <ion-button [routerLink]="item.path">{{ item.label }}</ion-button>
            }
            @if (session.signedIn()) {
              <ion-button (click)="signOut()">Salir</ion-button>
            } @else {
              <ion-button routerLink="/sign-in">Ingresar</ion-button>
            }
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <main><router-outlet /></main>
      </ion-content>
    </ion-app>
  `,
  styles: `.brand { color: inherit; text-decoration: none; }`,
})
export class AppComponent {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly sections = computed(() => {
    const role = this.session.user()?.role;
    return role ? NAVIGATION.filter((item) => item.roles.includes(role)) : [];
  });

  signOut(): void {
    this.session.signOut();
    void this.router.navigateByUrl('/sign-in');
  }
}
