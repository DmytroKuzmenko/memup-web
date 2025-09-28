// src/app/auth.interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationService } from './shared/services/notification.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.accessToken;
    console.log('=== AUTH INTERCEPTOR ===');
    console.log('Request URL:', req.url);
    console.log('Current token:', token);
    console.log('Token exists:', !!token);

    // Проверяем, не истек ли токен перед отправкой запроса
    if (token && !this.auth.hasValidToken()) {
      console.log('Token expired, redirecting to login before request');
      this.notification.showSessionExpired();
      if (!this.router.url.includes('/admin/login')) {
        this.auth.logout().subscribe();
        this.router.navigate(['/admin/login']);
      }
      return throwError(() => new Error('Token expired'));
    }

    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
    console.log('Request headers:', authReq.headers.keys());
    console.log('Authorization header:', authReq.headers.get('Authorization'));

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('=== AUTH INTERCEPTOR ERROR ===');
        console.log('Error status:', err.status);
        console.log('Error URL:', err.url);

        if (err.status === 401) {
          console.log('401 Unauthorized - token expired, redirecting to login');
          this.notification.showSessionExpired();

          // Проверяем, не находимся ли мы уже на странице логина
          if (!this.router.url.includes('/admin/login')) {
            console.log('Redirecting to login page');
            this.auth.logout().subscribe();
            this.router.navigate(['/admin/login']);
          }

          return throwError(() => err);
        }

        if (err.status === 413) {
          console.log('413 Payload Too Large - file size exceeds server limit');
          this.notification.showError('File is too large. Please select a smaller image.');
          return throwError(() => err);
        }

        console.log('Non-401/413 error, throwing');
        return throwError(() => err);
      }),
    );
  }
}
