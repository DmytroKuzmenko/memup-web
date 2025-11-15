import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from './shared/app-config';

export interface Section {
  id: string;
  name: string;
  imagePath?: string;
  orderIndex: number; // display order
  status: number; // 0 = draft, 1 = published
  createdAt: Date;
  updatedAt: Date;
}

// Интерфейс для публичного API секций
export interface PublicSection {
  id: string;
  name: string;
  imageUrl: string;
  completedLevelsCount: number;
  totalLevelsCount: number;
}

// How it comes from the API (dates are ISO strings)
interface SectionDto {
  id: string;
  name: string;
  imageUrl?: string | null; // API returns imageUrl (not imagePath)
  orderIndex: number;
  status: number;
  createdAt: string;
  updatedAt: string;
}

function mapDto(dto: SectionDto): Section {
  return {
    id: dto.id,
    name: dto.name,
    imagePath: dto.imageUrl ?? undefined, // map imageUrl to imagePath
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
    console.log('=== SECTION SERVICE GET SECTIONS ===');
    return this.http.get<SectionDto[]>(this.url).pipe(
      map((list) => {
        console.log('✅ Raw sections list from API:', JSON.stringify(list, null, 2));
        const mapped = list.map(mapDto);
        console.log('✅ Mapped sections list:', JSON.stringify(mapped, null, 2));
        mapped.forEach((section, index) => {
          console.log(`✅ Section ${index}: imagePath =`, section.imagePath);
        });
        return mapped;
      }),
    );
  }

  /** GET /api/sections/:id */
  getSectionById(id: string): Observable<Section> {
    console.log('=== SECTION SERVICE GET BY ID ===');
    console.log('Requesting section with ID:', id);
    console.log('Request URL:', `${this.url}/${id}`);

    return this.http.get<SectionDto>(`${this.url}/${id}`).pipe(
      map((dto) => {
        console.log('✅ Raw API response:', JSON.stringify(dto, null, 2));
        console.log('✅ imageUrl from API:', dto.imageUrl);
        const mapped = mapDto(dto);
        console.log('✅ Mapped section:', JSON.stringify(mapped, null, 2));
        console.log('✅ imagePath after mapping:', mapped.imagePath);
        return mapped;
      }),
    );
  }

  /** POST /api/sections */
  addSection(data: Partial<Section>): Observable<Section> {
    const payload = {
      name: data.name ?? '',
      imageUrl: data.imagePath ?? '', // API ожидает imageUrl, а не imagePath
      orderIndex: data.orderIndex ?? 0,
      status: data.status ?? 0,
    };
    console.log('=== SECTION SERVICE ADD ===');
    console.log('Adding new section');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    return this.http.post<SectionDto>(this.url, payload).pipe(
      map((dto) => {
        console.log('✅ Add response:', JSON.stringify(dto, null, 2));
        return mapDto(dto);
      }),
    );
  }

  /** PUT /api/sections/:id */
  updateSection(id: string, data: Partial<Section>): Observable<Section> {
    const payload = {
      name: data.name,
      imageUrl: data.imagePath, // API ожидает imageUrl, а не imagePath
      orderIndex: data.orderIndex,
      status: data.status,
    };
    console.log('=== SECTION SERVICE UPDATE ===');
    console.log('Updating section with ID:', id);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    return this.http.put<SectionDto>(`${this.url}/${id}`, payload).pipe(
      map((dto) => {
        console.log('✅ Update response:', JSON.stringify(dto, null, 2));
        return mapDto(dto);
      }),
    );
  }

  /** DELETE /api/sections/:id */
  deleteSection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** GET /api/public/sections */
  getPublicSections(): Observable<PublicSection[]> {
    console.log('=== SECTION SERVICE GET PUBLIC SECTIONS ===');
    const publicUrl = `${this.base}/public/sections`;
    console.log('Request URL:', publicUrl);

    return this.http.get<PublicSection[]>(publicUrl).pipe(
      map((sections) => {
        console.log('✅ Public sections from API:', JSON.stringify(sections, null, 2));
        return sections;
      }),
    );
  }
}
