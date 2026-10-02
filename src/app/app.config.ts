import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { routes } from './app.routes';
import { apiInterceptor } from './core/http/api.interceptor';

/**
 * The ONLY provideHttpClient() of the whole application (norm 5.4.1). Ionic Angular domain apps
 * loaded as routes inherit this client and its interceptor and must never provide their own;
 * Ionic React domain apps use the shell's apiClient, which applies the same rules.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiInterceptor])),
  ],
};
