import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'bs-not-found',
  imports: [RouterLink],
  template: `
    <section class="center">
      <h1>Página no encontrada</h1>
      <p>La dirección no existe. <a routerLink="/">Volver al inicio</a>.</p>
    </section>
  `,
  styles: `.center { display: grid; place-items: center; padding: 2rem; text-align: center; }`,
})
export class NotFoundComponent {}
