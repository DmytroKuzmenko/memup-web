import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../app-config';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);
  private cfg = inject(APP_CONFIG);

  uploadImage(file: File): Observable<HttpEvent<{ url: string }>> {
    const form = new FormData();
    form.append('file', file);
    const base = this.cfg.apiBaseUrl?.replace(/\/+$/, '') ?? '';
    const url = `${base}/api/uploads/image`;
    return this.http.post<{ url: string }>(url, form, { reportProgress: true, observe: 'events' });
  }
}
