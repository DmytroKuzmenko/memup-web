import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthInterceptor } from './app/auth.interceptor';
// Если файл APP_CONFIG лежит в другом месте, поправь путь импорта.
import { APP_CONFIG } from './app/shared/app-config';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),

    // HttpClient + поддержка DI-интерсепторов
    provideHttpClient(withInterceptorsFromDi()),

    // Регистрация JWT-интерсептора
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

    // Конфиг приложения: фронт всегда ходит на относительный /api
    {
      provide: APP_CONFIG,
      useValue: {
        apiBaseUrl: environment.apiBaseUrl, // '/api' в dev/prod
      },
    },
  ],
});
