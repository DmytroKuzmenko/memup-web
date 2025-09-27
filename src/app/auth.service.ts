// src/app/auth.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError } from 'rxjs';
import { APP_CONFIG, AppConfig } from './shared/app-config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  role?: string; // сервер может отдать роль прямо в ответе
  expiresIn?: number; // (опционально) секунды жизни accessToken
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

type StoredAuth = Required<Pick<LoginResponse, 'accessToken'>> &
  Partial<Pick<LoginResponse, 'refreshToken' | 'role'>>;

const LS_KEY = 'memup_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = inject<AppConfig>(APP_CONFIG).apiBaseUrl; // '/api'

  userRole = signal<string | null>(
    this.restore()?.role ?? this.roleFromToken(this.restore()?.accessToken) ?? null,
  );

  /** ===== Public API ===== */

  /** POST /auth/login */
  login(payload: LoginRequest): Observable<void> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, payload).pipe(
      tap((resp) => this.persist(resp)),
      map(() => void 0),
    );
  }

  /** POST /auth/refresh */
  refresh(): Observable<string | null> {
    const current = this.restore();
    if (!current?.refreshToken) return of(null);

    return this.http
      .post<RefreshResponse>(`${this.base}/auth/refresh`, {
        refreshToken: current.refreshToken,
      })
      .pipe(
        tap((resp) => this.persist({ ...current, ...resp })),
        map((resp) => resp.accessToken ?? null),
        catchError(() => of(null)),
      );
  }

  /** POST /auth/logout (опционально, если есть на бэке), + локальная очистка */
  logout(callApi = false): Observable<void> {
    const current = this.restore();
    const performLocal = () => {
      localStorage.removeItem(LS_KEY);
      this.userRole.set(null);
    };

    if (callApi && current?.refreshToken) {
      return this.http
        .post<void>(`${this.base}/auth/logout`, {
          refreshToken: current.refreshToken,
        })
        .pipe(
          tap(() => performLocal()),
          catchError(() => {
            // даже если API не ответил — чистим локально
            performLocal();
            return of(void 0);
          }),
        );
    }

    performLocal();
    return of(void 0);
  }

  /** Есть ли валидный (не протухший) accessToken */
  hasValidToken(): boolean {
    const token = this.accessToken;
    if (!token) return false;
    return !this.isJwtExpired(token);
  }

  /** Текущий accessToken (или null) */
  get accessToken(): string | null {
    return this.restore()?.accessToken ?? null;
  }

  /** Быстрая проверка роли */
  isAdmin(): boolean {
    return (this.userRole() ?? '').toLowerCase() === 'admin';
  }

  /** ===== Internal helpers ===== */

  private restore(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as StoredAuth) : null;
    } catch {
      return null;
    }
  }

  private persist(resp: Partial<LoginResponse>) {
    const prev = this.restore() ?? ({} as StoredAuth);
    const next: StoredAuth = {
      accessToken: resp.accessToken ?? prev.accessToken!,
      refreshToken: resp.refreshToken ?? prev.refreshToken,
      role:
        resp.role ??
        prev.role ??
        this.roleFromToken(resp.accessToken ?? prev.accessToken!) ??
        undefined,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    this.userRole.set(next.role ?? null);
  }

  private roleFromToken(token?: string): string | null {
    if (!token) return null;
    const payload = this.decodeJwt(token);
    // популярные варианты клеймов: "role", "roles", "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    const claimRole =
      payload?.role ??
      (Array.isArray(payload?.roles) ? payload.roles[0] : payload?.roles) ??
      payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (!claimRole) return null;
    return Array.isArray(claimRole) ? (claimRole[0] ?? null) : String(claimRole);
  }

  private isJwtExpired(token: string): boolean {
    const payload = this.decodeJwt(token);
    const exp: number | undefined = payload?.exp;
    if (!exp) return false; // нет exp — считаем валидным (или поменяй на true, если хочешь жёстче)
    const nowSec = Math.floor(Date.now() / 1000);
    return exp <= nowSec;
  }

  private decodeJwt(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      // atob безопасно в браузере; заменяем url-safe символы
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }
}
