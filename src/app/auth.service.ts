// src/app/auth.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap, catchError } from 'rxjs';
import { APP_CONFIG, AppConfig } from './shared/app-config';

export interface LoginRequest {
  email: string;
  password: string;
}

/** Фактический ответ memeup-api */
export interface ApiLoginResponse {
  token: string; // JWT
  expiresAt: string; // ISO-строка (UTC), например "2025-09-27T23:59:20.332563Z"
}

/** Если появится refresh — можно раскомментить и использовать */
export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

type StoredAuth = {
  accessToken: string;
  role?: string | null;
  /** fallback, если в токене вдруг нет exp */
  expiresAtIso?: string;
  refreshToken?: string | null;
};

const LS_KEY = 'memup_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = inject<AppConfig>(APP_CONFIG).apiBaseUrl; // '/api'

  /** реактивная роль пользователя (для guard/шапки и т.п.) */
  userRole = signal<string | null>(
    this.restore()?.role ?? this.roleFromToken(this.restore()?.accessToken) ?? null,
  );

  /** === Публичное API === */

  /** POST /auth/login — маппим token/expiresAt */
  login(payload: LoginRequest): Observable<void> {
    return this.http.post<ApiLoginResponse>(`${this.base}/auth/login`, payload).pipe(
      tap((resp) => this.persistFromApi(resp)),
      map(() => void 0),
      catchError((err) => {
        // аккуратно пробрасываем ошибку наверх
        throw err;
      }),
    );
  }

  /** POST /auth/refresh — если у бэка нет, просто возвращаем null */
  refresh(): Observable<string | null> {
    const current = this.restore();
    if (!current?.refreshToken) return of(null);
    return this.http
      .post<RefreshResponse>(`${this.base}/auth/refresh`, {
        refreshToken: current.refreshToken,
      })
      .pipe(
        tap((resp) => {
          const next: StoredAuth = {
            accessToken: resp.accessToken,
            refreshToken: resp.refreshToken ?? current.refreshToken ?? null,
            role: this.roleFromToken(resp.accessToken),
            // expiresAtIso может не прийти — оставим прежнее
            expiresAtIso: current.expiresAtIso,
          };
          localStorage.setItem(LS_KEY, JSON.stringify(next));
          this.userRole.set(next.role ?? null);
        }),
        map((resp) => resp.accessToken ?? null),
        catchError(() => of(null)),
      );
  }

  /** Логаут (локально, при желании можно добавить вызов /auth/logout на бэке) */
  logout(): Observable<void> {
    localStorage.removeItem(LS_KEY);
    this.userRole.set(null);
    return of(void 0);
  }

  /** Есть ли валидный (не истёкший) токен */
  hasValidToken(): boolean {
    const token = this.accessToken;
    if (!token) return false;
    return !this.isJwtExpired(token);
  }

  /** Текущий accessToken (или null) */
  get accessToken(): string | null {
    return this.restore()?.accessToken ?? null;
  }

  /** Проверка роли администратора */
  isAdmin(): boolean {
    return (this.userRole() ?? '').toLowerCase() === 'admin';
  }

  /** === Внутреннее === */

  /** Сохраняем ответ логина из API в хранилище */
  private persistFromApi(resp: ApiLoginResponse) {
    const accessToken = resp.token;
    const role = this.roleFromToken(accessToken);
    const toStore: StoredAuth = {
      accessToken,
      role,
      expiresAtIso: resp.expiresAt ?? undefined,
      // refreshToken не приходит — оставим null на будущее
      refreshToken: null,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(toStore));
    this.userRole.set(role ?? null);
  }

  private restore(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as StoredAuth) : null;
    } catch {
      return null;
    }
  }

  /** Достаём роль из клеймов JWT */
  private roleFromToken(token?: string): string | null {
    if (!token) return null;
    const payload = this.decodeJwt(token);
    if (!payload) return null;

    // Популярные варианты клеймов роли:
    // role / roles / microsoft-namespace (из твоего примера)
    const claimRole =
      payload?.role ??
      (Array.isArray(payload?.roles) ? payload.roles[0] : payload?.roles) ??
      payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    if (!claimRole) return null;
    return Array.isArray(claimRole) ? (claimRole[0] ?? null) : String(claimRole);
  }

  /** Проверяем истечение токена: сначала exp из JWT, иначе falls back на expiresAtIso */
  private isJwtExpired(token: string): boolean {
    const payload = this.decodeJwt(token);
    const exp: number | undefined = payload?.exp; // секунды с эпохи
    if (typeof exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      return exp <= nowSec;
    }
    const iso = this.restore()?.expiresAtIso;
    if (!iso) return false;
    return new Date(iso).getTime() <= Date.now();
  }

  private decodeJwt(token: string): any | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      // escape/unescape устаревшие, но для ASCII payload обычно ок; если будут юникод-символы — можно заменить на более надёжный декодер
      return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
      return null;
    }
  }
}
