import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { APP_CONFIG } from '../app-config';
import { isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);
  private cfg = inject(APP_CONFIG);

  uploadImage(file: File): Observable<HttpEvent<{ url: string }>> {
    const form = new FormData();
    form.append('file', file);
    const base = this.cfg.apiBaseUrl?.replace(/\/+$/, '') ?? '';
    const url = `${base}/Files`;
    return this.http.post<{ url: string }>(url, form, { reportProgress: true, observe: 'events' });
  }

  // Новый метод для получения только финального результата
  uploadFile(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    const base = this.cfg.apiBaseUrl?.replace(/\/+$/, '') ?? '';
    const url = `${base}/Files`;
    return this.http.post<{ url: string }>(url, form).pipe(
      map((response) => ({
        ...response,
        url: this.convertUrl(response.url),
      })),
    );
  }

  uploadImageResult(file: File): Observable<{ url: string }> {
    return this.uploadFile(file);
  }

  private convertUrl(absoluteUrl: string): string {
    if (isDevMode()) {
      // В development конвертируем в относительный URL для прокси
      const url = new URL(absoluteUrl);
      return url.pathname;
    } else {
      // В production возвращаем полный URL для статических файлов
      return absoluteUrl;
    }
  }
}
