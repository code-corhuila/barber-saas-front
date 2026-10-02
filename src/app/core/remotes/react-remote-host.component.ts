import { AfterViewInit, Component, ElementRef, OnDestroy, inject, input, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';
import { apiClient } from '../http/api-client';
import { sessionStore } from '../session/session-store';
import { MountContext, MountFunction, Unmount } from './mount-contract';

/**
 * Hosts one Ionic React domain app inside the Angular shell (ADR-013). It loads the remote's
 * './mount', hands it an element and the MountContext, and unmounts it when the route changes.
 * A remote that cannot be loaded shows its own notice; the rest of the app keeps working.
 */
@Component({
  selector: 'bs-react-remote-host',
  imports: [IonButton, IonSpinner],
  template: `
    @if (state() === 'loading') {
      <div class="center" role="status"><ion-spinner aria-label="Cargando" /></div>
    }
    @if (state() === 'unavailable') {
      <section class="center" role="alert">
        <h2>{{ title() }} no está disponible en este momento</h2>
        <p>El resto de la aplicación sigue funcionando.</p>
        <ion-button (click)="retry()">Intentar de nuevo</ion-button>
      </section>
    }
    <div #mountPoint class="mount-point"></div>
  `,
  styles: `.center { display: grid; place-items: center; padding: 2rem; text-align: center; }
           .mount-point { height: 100%; }`,
})
export class ReactRemoteHostComponent implements AfterViewInit, OnDestroy {
  /** Name of the remote in federation.manifest.json. */
  readonly remote = input.required<string>();
  /** Title shown if the remote cannot be loaded. */
  readonly title = input.required<string>();
  /** Path where this domain is mounted, e.g. '/appointments'. */
  readonly basePath = input.required<string>();

  private readonly mountPoint = viewChild.required<ElementRef<HTMLElement>>('mountPoint');
  private readonly router = inject(Router);
  readonly state = signal<'loading' | 'ready' | 'unavailable'>('loading');
  private unmount: Unmount | null = null;

  async ngAfterViewInit(): Promise<void> {
    try {
      const module = await loadRemoteModule(this.remote(), './mount');
      const mount: MountFunction = module.mount ?? module.default;
      this.unmount = await mount(this.mountPoint().nativeElement, this.context());
      this.state.set('ready');
    } catch (err) {
      console.error(`domain app "${this.remote()}" failed to load`, err);
      this.state.set('unavailable');
    }
  }

  ngOnDestroy(): void {
    this.unmount?.();
  }

  retry(): void {
    window.location.reload();
  }

  private context(): MountContext {
    const basePath = this.basePath();
    const full = this.router.url.split('?')[0] ?? '';
    return {
      api: apiClient,
      session: {
        user: () => sessionStore.get()?.user ?? null,
        signIn: (auth) => sessionStore.signIn(auth),
        signOut: () => sessionStore.clear(),
        subscribe: (listener) => sessionStore.subscribe((s) => listener(s?.user ?? null)),
      },
      basePath,
      initialPath: full.startsWith(basePath) ? full.slice(basePath.length) || '/' : '/',
      navigate: (path) => void this.router.navigateByUrl(path),
    };
  }
}
