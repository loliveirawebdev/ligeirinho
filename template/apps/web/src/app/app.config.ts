import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { type ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '@app/tasks-web';
import { accessTokenInterceptor } from './access-token.interceptor';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([accessTokenInterceptor])),
    // The dev server proxies /api to the API (proxy.conf.json), so the browser never needs CORS locally.
    { provide: API_BASE_URL, useValue: '/api' },
    // <mat-icon>check</mat-icon> draws from Material Symbols (self-hosted, styles in project.json).
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
  ],
};
