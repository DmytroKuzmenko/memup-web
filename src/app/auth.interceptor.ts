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

    // Check whether the token has expired before sending the request
    if (token && !this.auth.hasValidToken()) {
      console.log('Token expired, checking if this is a game request');

      // If this is a game request, do not show a notification or redirect
      if (req.url.includes('/api/game/')) {
        console.log('Game request with expired token - letting server handle it');
        // Simply send the request without a token and let the server return 401
      } else {
        // Check whether we are in the admin section
        const isInAdminSection = this.router.url.includes('/admin');

        if (isInAdminSection) {
          console.log('Admin request with expired token - redirecting to login');
          this.notification.showSessionExpired();
          if (!this.router.url.includes('/admin/login')) {
            this.auth.logout().subscribe();
            this.router.navigate(['/admin/login']);
          }
          return throwError(() => new Error('Token expired'));
        } else {
          console.log('Non-admin request with expired token - letting server handle it');
          // Просто отправляем запрос без токена, пусть сервер вернет 401
        }
      }
    }

    // Add headers for game API calls
    let headers: { [key: string]: string } = {};

    // Add authorization header if token exists and is valid
    if (token && this.auth.hasValidToken()) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add no-cache headers for game API calls
    if (req.url.includes('/api/game/')) {
      headers['Cache-Control'] = 'no-store';
    }

    const authReq = Object.keys(headers).length > 0 ? req.clone({ setHeaders: headers }) : req;
    console.log('Request headers:', authReq.headers.keys());
    console.log('Authorization header:', authReq.headers.get('Authorization'));
    console.log('Cache-Control header:', authReq.headers.get('Cache-Control'));

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('=== AUTH INTERCEPTOR ERROR ===');
        console.log('Error status:', err.status);
        console.log('Error URL:', err.url);

        if (err.status === 401) {
          console.log('401 Unauthorized - token expired');

          // Check whether this is an authentication request
          const isAuthRequest =
            req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

          if (isAuthRequest) {
            console.log('401 on auth request - not redirecting, letting component handle error');
            return throwError(() => err);
          }

          // Check if this is a game API call
          const isGameRequest = req.url.includes('/api/game/');

          if (isGameRequest) {
            console.log('401 on game request - letting component handle it');
            // Do not show a notification or redirect for game requests
            // Let components decide how to handle the 401 error
            return throwError(() => err);
          }

          // Check whether we are in the admin section
          const isInAdminSection = this.router.url.includes('/admin');

          if (isInAdminSection) {
            console.log('401 on admin request - redirecting to admin login');
            this.notification.showSessionExpired();

            // Check if we are already on the login page
            if (!this.router.url.includes('/admin/login')) {
              console.log('Redirecting to admin login page');
              this.auth.logout().subscribe();
              this.router.navigate(['/admin/login']);
            }
          } else {
            console.log('401 on non-admin request - letting component handle error');
            // Do not show a notification or redirect for non-admin requests
            // Let components decide how to handle the 401 error
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
