import { Component, input } from '@angular/core';
import { Routes } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';

/** Replaces the routes of an Ionic Angular domain app whose remoteEntry cannot be loaded. */
@Component({
  selector: 'bs-remote-unavailable',
  imports: [IonButton],
  template: `
    <section role="alert" class="center">
      <h2>{{ portal() }} no está disponible en este momento</h2>
      <p>El resto de la aplicación sigue funcionando.</p>
      <ion-button (click)="retry()">Intentar de nuevo</ion-button>
    </section>
  `,
  styles: `.center { display: grid; place-items: center; padding: 2rem; text-align: center; }`,
})
export class RemoteUnavailableComponent {
  readonly portal = input.required<string>();

  retry(): void {
    window.location.reload();
  }
}

export function remoteUnavailable(portal: string, err: unknown): Routes {
  console.error(`domain app "${portal}" failed to load`, err);
  return [{ path: '**', component: RemoteUnavailableComponent, data: { portal } }];
}
