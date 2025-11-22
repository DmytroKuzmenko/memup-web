// src/app/auth.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError, throwError } from 'rxjs';
import { APP_CONFIG, AppConfig } from './shared/app-config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  userName: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
}

/** Actual response from memeup-api */
export interface AuthResponse {
  token: string; // JWT
  refreshToken: string;
  expiresAt: string; // ISO-строка (UTC), например "2025-09-27T23:59:20.332563Z"
}

type StoredAuth = {
  accessToken: string;
  role?: string | null;
  /** fallback, если в токене вдруг нет exp */
  expiresAtIso?: string;
  refreshToken?: string | null;
  refreshCount?: number;
};

const LS_KEY = 'memup_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = inject<AppConfig>(APP_CONFIG).apiBaseUrl; // '/api'
  private authState: StoredAuth | null = this.restore();
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** reactive user role (for guards/header etc.) */
  userRole = signal<string | null>(
    this.restore()?.role ?? this.roleFromToken(this.restore()?.accessToken) ?? null,
  );

  constructor() {
    this.scheduleRefresh();
  }

  /** === Публичное API === */

  /** POST /auth/register — register a new user */
  register(payload: RegisterRequest): Observable<RegisterResponse> {
    console.log('=== AUTH SERVICE REGISTER CALLED ===');
    console.log('AuthService.register called with payload:', payload);
    console.log('Making request to:', `${this.base}/auth/register`);

    return this.http.post<RegisterResponse>(`${this.base}/auth/register`, payload).pipe(
      tap((resp) => {
        console.log('✅ Registration response received:', resp);
      }),
      catchError((err) => {
        console.error('❌ Registration error:', err);
        throw err;
      }),
    );
  }

  /** POST /auth/login — map token/expiresAt */
  login(payload: LoginRequest): Observable<void> {
    console.log('=== AUTH SERVICE LOGIN CALLED ===');
    console.log('AuthService.login called with payload:', payload);
    console.log('Making request to:', `${this.base}/auth/login`);
    console.log('Base URL:', this.base);

    return this.http.post<AuthResponse>(`${this.base}/auth/login`, payload).pipe(
      tap((resp) => {
        console.log('✅ Server response received:', resp);
        this.persistFromApi(resp, 0);
      }),
      map(() => void 0),
      catchError((err) => {
        console.error('❌ Login error:', err);
        // аккуратно пробрасываем ошибку наверх
        throw err;
      }),
    );
  }

  /** POST /auth/refresh */
  refresh(): Observable<void> {
    console.log('=== AUTH SERVICE REFRESH ===');

    const refreshToken = this.refreshToken;
    const refreshCount = this.authState?.refreshCount ?? 0;

    if (!refreshToken) {
      console.log('No refresh token stored - cannot refresh');
      return throwError(() => new Error('No refresh token'));
    }

    if (refreshCount >= 10) {
      console.log('Refresh limit reached - forcing re-login');
      this.logout();
      return throwError(() => new Error('Refresh limit exceeded'));
    }

    return this.http
      .post<AuthResponse>(`${this.base}/auth/refresh`, { refreshToken })
      .pipe(
        tap((resp) => {
          console.log('✅ Refresh response received:', resp);
          this.persistFromApi(resp, refreshCount + 1);
        }),
        map(() => void 0),
        catchError((err) => {
          console.error('❌ Refresh error:', err);
          this.logout();
          throw err;
        }),
      );
  }

  /** Logout (local). Optionally call /auth/logout on the backend if desired */
  logout(): Observable<void> {
    this.clearRefreshTimer();
    localStorage.removeItem(LS_KEY);
    this.authState = null;
    this.userRole.set(null);
    return of(void 0);
  }

  /** Is there a valid (not expired) token */
  hasValidToken(): boolean {
    const token = this.accessToken;
    if (!token) {
      console.log('No token found');
      return false;
    }

    const isValid = !this.isJwtExpired(token);
    console.log('Token validation:', { token: token.substring(0, 20) + '...', isValid });

    return isValid;
  }

  /** Current accessToken (or null) */
  get accessToken(): string | null {
    return this.authState?.accessToken ?? null;
  }

  get refreshToken(): string | null {
    return this.authState?.refreshToken ?? null;
  }

  /** Check if the user has administrator role */
  isAdmin(): boolean {
    return (this.userRole() ?? '').toLowerCase() === 'admin';
  }

  /** === Internal === */

  /** Persist login response from API into storage */
  private persistFromApi(resp: AuthResponse, refreshCount: number) {
    console.log('=== PERSIST FROM API ===');
    console.log('API response:', resp);

    const accessToken = resp.token;
    const role = this.roleFromToken(accessToken);

    console.log('Extracted token:', accessToken);
    console.log('Extracted role:', role);

    const toStore: StoredAuth = {
      accessToken,
      role,
      expiresAtIso: resp.expiresAt ?? undefined,
      refreshToken: resp.refreshToken,
      refreshCount,
    };

    console.log('Data to store:', toStore);
    this.authState = toStore;
    localStorage.setItem(LS_KEY, JSON.stringify(toStore));
    this.userRole.set(role ?? null);
    this.scheduleRefresh();
    console.log('User role signal set to:', role);
    console.log('=== END PERSIST ===');
  }

  private restore(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as StoredAuth) : null;
    } catch {
      return null;
    }
  }

  /** Extract role from JWT claims */
  private roleFromToken(token?: string): string | null {
    if (!token) {
      console.log('No token provided to roleFromToken');
      return null;
    }

    console.log('=== EXTRACTING ROLE FROM TOKEN ===');
    console.log('Token:', token);

    const payload = this.decodeJwt(token);
    console.log('JWT payload:', payload);

    if (!payload) {
      console.log('Failed to decode JWT payload');
      return null;
    }

    // Common role claim variants:
    // role / roles / microsoft-namespace (from your example)
    const claimRole =
      payload?.role ??
      (Array.isArray(payload?.roles) ? payload.roles[0] : payload?.roles) ??
      payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    console.log('Available claims:', Object.keys(payload));
    console.log(
      'Looking for role claims: role, roles, http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    );
    console.log('Found claimRole:', claimRole);

    if (!claimRole) {
      console.log('No role claim found in token');
      return null;
    }

    const finalRole = Array.isArray(claimRole) ? (claimRole[0] ?? null) : String(claimRole);
    console.log('Final extracted role:', finalRole);
    console.log('=== END ROLE EXTRACTION ===');

    return finalRole;
  }

  /** Check token expiration: first exp from JWT, otherwise fallback to expiresAtIso */
  private isJwtExpired(token: string): boolean {
    const payload = this.decodeJwt(token);
    const exp: number | undefined = payload?.exp; // секунды с эпохи
    if (typeof exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      return exp <= nowSec;
    }
    const iso = this.authState?.expiresAtIso;
    if (!iso) return false;
    return new Date(iso).getTime() <= Date.now();
  }

  private scheduleRefresh(): void {
    this.clearRefreshTimer();

    if (!this.authState?.refreshToken) {
      console.log('No refresh token available - skipping auto refresh setup');
      return;
    }

    const expiryMs = this.getExpiryTimestamp();
    if (!expiryMs) {
      console.log('No expiry information available - skipping auto refresh setup');
      return;
    }

    const delay = Math.max(expiryMs - Date.now() - 2000, 0); // refresh 2s before expiry

    console.log('Scheduling auto refresh in ms:', delay);

    this.refreshTimeoutId = setTimeout(() => {
      this.refresh().subscribe({
        error: () => {
          this.clearRefreshTimer();
        },
      });
    }, delay);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }

  private getExpiryTimestamp(): number | null {
    const token = this.accessToken;
    const payload = this.decodeJwt(token ?? '');
    if (payload?.exp) {
      return payload.exp * 1000;
    }

    if (this.authState?.expiresAtIso) {
      return new Date(this.authState.expiresAtIso).getTime();
    }

    return null;
  }

  private decodeJwt(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      // escape/unescape are deprecated, but for ASCII payload it's usually OK; if there are Unicode characters consider a more robust decoder
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }
}
