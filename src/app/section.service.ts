import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from './shared/app-config';

export interface Section {
  id: number;
  name: string;
  imagePath?: string;
  orderIndex: number; // порядок отображения
  status: number; // 0 = Чернетка, 1 = Опубліковано
  createdAt: Date;
  updatedAt: Date;
}

// Как приходит с API (даты — строки ISO)
interface SectionDto {
  id: number;
  name: string;
  imagePath?: string | null;
  orderIndex: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

function mapDto(dto: SectionDto): Section {
  return {
    id: dto.id,
    name: dto.name,
    imagePath: dto.imagePath ?? undefined,
    orderIndex: dto.orderIndex,
    status: dto.status,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

@Injectable({ providedIn: 'root' })
export class SectionService {
  private readonly http = inject(HttpClient);
  private readonly base = inject<AppConfig>(APP_CONFIG).apiBaseUrl; // '/api'
  private readonly url = `${this.base}/sections`;

  /** GET /api/sections */
  getSections(): Observable<Section[]> {
    return this.http.get<SectionDto[]>(this.url).pipe(map((list) => list.map(mapDto)));
  }

  /** GET /api/sections/:id */
  getSectionById(id: number): Observable<Section> {
    return this.http.get<SectionDto>(`${this.url}/${id}`).pipe(map(mapDto));
  }

  /** POST /api/sections */
  addSection(data: Partial<Section>): Observable<Section> {
    const payload = {
      name: data.name ?? '',
      imagePath: data.imagePath ?? '',
      orderIndex: data.orderIndex ?? 0,
      status: data.status ?? 0,
    };
    return this.http.post<SectionDto>(this.url, payload).pipe(map(mapDto));
  }

  /** PUT /api/sections/:id */
  updateSection(id: number, data: Partial<Section>): Observable<Section> {
    const payload = {
      name: data.name,
      imagePath: data.imagePath,
      orderIndex: data.orderIndex,
      status: data.status,
    };
    return this.http.put<SectionDto>(`${this.url}/${id}`, payload).pipe(map(mapDto));
  }

  /** DELETE /api/sections/:id */
  deleteSection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
