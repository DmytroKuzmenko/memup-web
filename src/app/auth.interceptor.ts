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
    const authReq = this.addAuthHeader(req);
    console.log('=== AUTH INTERCEPTOR ===');
    console.log('Request URL:', req.url);
    console.log('Authorization header:', authReq.headers.get('Authorization'));
    console.log('Cache-Control header:', authReq.headers.get('Cache-Control'));

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        console.log('=== AUTH INTERCEPTOR ERROR ===');
        console.log('Error status:', err.status);
        console.log('Error URL:', err.url);

        if (err.status !== 401) {
          if (err.status === 413) {
            console.log('413 Payload Too Large - file size exceeds server limit');
            this.notification.showError('File is too large. Please select a smaller image.');
          } else {
            console.log('Non-401/413 error, throwing');
          }
          return throwError(() => err);
        }

        if (this.isAuthRequest(req)) {
          console.log('401 on auth request - not triggering refresh');
          return throwError(() => err);
        }

        if (!this.auth.refreshToken) {
          console.log('401 without refresh token - handling as unauthorized');
          this.handleUnauthorized(req);
          return throwError(() => err);
        }

        return this.auth.refresh().pipe(
          switchMap(() => next.handle(this.addAuthHeader(req))),
          catchError((refreshErr) => {
            console.log('Refresh failed, logging out');
            this.auth.logout().subscribe();
            this.handleUnauthorized(req);
            return throwError(() => refreshErr);
          }),
        );
      }),
    );
  }

  private addAuthHeader(req: HttpRequest<any>): HttpRequest<any> {
    const token = this.auth.accessToken;
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.isGameRequest(req)) {
      headers['Cache-Control'] = 'no-store';
    }

    if (Object.keys(headers).length === 0) {
      return req;
    }

    return req.clone({ setHeaders: headers });
  }

  private isAuthRequest(req: HttpRequest<any>): boolean {
    return (
      req.url.includes('/api/auth/login') ||
      req.url.includes('/api/auth/register') ||
      req.url.includes('/api/auth/refresh')
    );
  }

  private isGameRequest(req: HttpRequest<any>): boolean {
    return req.url.includes('/api/game/');
  }

  private handleUnauthorized(req: HttpRequest<any>): void {
    if (this.isGameRequest(req)) {
      console.log('Game request unauthorized - skipping navigation');
      return;
    }

    const isInAdminSection = this.router.url.includes('/admin');

    if (isInAdminSection) {
      this.notification.showSessionExpired();
      if (!this.router.url.includes('/admin/login')) {
        this.router.navigate(['/admin/login']);
      }
    }
  }
}
