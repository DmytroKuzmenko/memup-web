import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { APP_CONFIG } from '../app-config';

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
  uploadImageResult(file: File): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    const base = this.cfg.apiBaseUrl?.replace(/\/+$/, '') ?? '';
    const url = `${base}/Files`;
    return this.http.post<{ url: string }>(url, form).pipe(
      map((response) => ({
        ...response,
        url: this.convertToRelativeUrl(response.url),
      })),
    );
  }

  private convertToRelativeUrl(absoluteUrl: string): string {
    // Конвертируем http://localhost:8080/uploads/file.png в /uploads/file.png
    const url = new URL(absoluteUrl);
    return url.pathname;
  }
}
