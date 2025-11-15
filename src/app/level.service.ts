import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from './shared/app-config';

export interface Level {
  id: string; // UUID
  sectionId: string; // UUID
  name: string;
  imagePath?: string; // level image
  headerText?: string; // phrase before the level (was prefaceText)
  animationImagePath?: string; // animation (gif/webp) left-to-right
  orderIndex?: number;
  timeLimitSec?: number; // time in seconds (was timeLimitSeconds)
  status: number; // 0 = draft, 1 = published
  createdAt: Date;
  updatedAt: Date;
}

// How it comes from the API (dates are ISO strings)
interface LevelDto {
  id: string;
  sectionId: string;
  name: string;
  imageUrl?: string | null; // API returns imageUrl
  headerText?: string | null; // API returns headerText
  animationImageUrl?: string | null; // API returns animationImageUrl
  orderIndex?: number;
  timeLimitSec?: number; // API возвращает timeLimitSec
  status: number;
  createdAt: string;
  updatedAt: string;
}

function mapDto(dto: LevelDto): Level {
  return {
    id: dto.id,
    sectionId: dto.sectionId,
    name: dto.name,
    imagePath: dto.imageUrl ?? undefined, // map imageUrl to imagePath
    headerText: dto.headerText ?? undefined, // map headerText
    animationImagePath: dto.animationImageUrl ?? undefined, // map animationImageUrl to animationImagePath
    orderIndex: dto.orderIndex,
    timeLimitSec: dto.timeLimitSec, // map timeLimitSec
    status: dto.status,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

@Injectable({ providedIn: 'root' })
export class LevelService {
  private readonly http = inject(HttpClient);
  private readonly base = inject<AppConfig>(APP_CONFIG).apiBaseUrl; // '/api'
  private readonly levelsUrl = `${this.base}/Levels`; // API uses 'Levels' with uppercase

  /** GET /api/sections/{sectionId}/levels */
  getLevels(sectionId: string): Observable<Level[]> {
    console.log('=== LEVEL SERVICE GET LEVELS ===');
    console.log('Section ID:', sectionId);
    const url = `${this.base}/sections/${sectionId}/levels`;
    console.log('Request URL:', url);

    return this.http.get<LevelDto[]>(url).pipe(
      map((list) => {
        console.log('✅ Raw levels list from API:', JSON.stringify(list, null, 2));
        const mapped = list.map(mapDto);
        console.log('✅ Mapped levels list:', JSON.stringify(mapped, null, 2));
        mapped.forEach((level: Level, index: number) => {
          console.log(`✅ Level ${index}: imagePath =`, level.imagePath);
        });
        return mapped;
      }),
    );
  }

  /** GET /api/Levels - get all levels */
  getAllLevels(): Observable<Level[]> {
    console.log('=== LEVEL SERVICE GET ALL LEVELS ===');
    console.log('Request URL:', this.levelsUrl);

    return this.http.get<LevelDto[]>(this.levelsUrl).pipe(
      map((list) => {
        console.log('✅ Raw all levels list from API:', JSON.stringify(list, null, 2));
        const mapped = list.map(mapDto);
        console.log('✅ Mapped all levels list:', JSON.stringify(mapped, null, 2));
        return mapped;
      }),
    );
  }

  /** GET /api/Levels/:id */
  getLevelById(id: string): Observable<Level> {
    console.log('=== LEVEL SERVICE GET BY ID ===');
    console.log('Requesting level with ID:', id);
    console.log('Request URL:', `${this.levelsUrl}/${id}`);

    return this.http.get<LevelDto>(`${this.levelsUrl}/${id}`).pipe(
      map((dto) => {
        console.log('✅ Raw API response:', JSON.stringify(dto, null, 2));
        console.log('✅ imageUrl from API:', dto.imageUrl);
        const mapped = mapDto(dto);
        console.log('✅ Mapped level:', JSON.stringify(mapped, null, 2));
        console.log('✅ imagePath after mapping:', mapped.imagePath);
        return mapped;
      }),
    );
  }

  /** POST /api/Levels */
  addLevel(data: Partial<Level>): Observable<Level> {
    const payload = {
      sectionId: data.sectionId ?? '',
      name: data.name ?? '',
      imageUrl: data.imagePath ?? '', // API expects imageUrl
      headerText: data.headerText ?? '', // API expects headerText
      animationImageUrl: data.animationImagePath ?? '', // API expects animationImageUrl
      orderIndex: data.orderIndex ?? 0,
      timeLimitSec: data.timeLimitSec ?? 0, // API expects timeLimitSec
      status: data.status ?? 0,
    };
    console.log('=== LEVEL SERVICE ADD ===');
    console.log('Adding new level');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    return this.http.post<LevelDto>(this.levelsUrl, payload).pipe(
      map((dto) => {
        console.log('✅ Add response:', JSON.stringify(dto, null, 2));
        return mapDto(dto);
      }),
    );
  }

  /** PUT /api/Levels/:id */
  updateLevel(id: string, data: Partial<Level>): Observable<Level> {
    const payload = {
      name: data.name,
      imageUrl: data.imagePath, // API expects imageUrl
      headerText: data.headerText, // API expects headerText
      animationImageUrl: data.animationImagePath, // API expects animationImageUrl
      orderIndex: data.orderIndex,
      timeLimitSec: data.timeLimitSec, // API expects timeLimitSec
      status: data.status,
    };
    console.log('=== LEVEL SERVICE UPDATE ===');
    console.log('Updating level with ID:', id);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    return this.http.put<LevelDto>(`${this.levelsUrl}/${id}`, payload).pipe(
      map((dto) => {
        console.log('✅ Update response:', JSON.stringify(dto, null, 2));
        return mapDto(dto);
      }),
    );
  }

  /** DELETE /api/Levels/:id */
  deleteLevel(id: string): Observable<void> {
    console.log('=== LEVEL SERVICE DELETE ===');
    console.log('Deleting level with ID:', id);
    return this.http.delete<void>(`${this.levelsUrl}/${id}`);
  }
}
