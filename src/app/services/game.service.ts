import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { APP_CONFIG, AppConfig } from '../shared/app-config';
import {
  SectionVm,
  LevelVm,
  LevelIntroVm,
  NextTaskResponse,
  SubmitResponse,
  LeaderboardEntryVm,
  ReplayResponse,
} from '../shared/models/game.models';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly http = inject(HttpClient);
  private readonly base = inject<AppConfig>(APP_CONFIG).apiBaseUrl;
  private readonly gameUrl = `${this.base}/game`;

  // Generate UUID for idempotency key
  private generateIdempotencyKey(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Helper method to add no-cache headers for game API calls
  private getGameHeaders(additionalHeaders: Record<string, string> = {}): HttpHeaders {
    return new HttpHeaders({
      'Cache-Control': 'no-store',
      ...additionalHeaders,
    });
  }

  /** GET /api/game/sections */
  getSections(): Observable<SectionVm[]> {
    console.log('=== GAME SERVICE GET SECTIONS ===');
    return this.http
      .get<SectionVm[]>(`${this.gameUrl}/sections`, {
        headers: this.getGameHeaders(),
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /** GET /api/game/sections/{sectionId}/levels */
  getLevels(sectionId: string): Observable<LevelVm[]> {
    console.log('=== GAME SERVICE GET LEVELS ===');
    console.log('Section ID:', sectionId);
    return this.http
      .get<LevelVm[]>(`${this.gameUrl}/sections/${sectionId}/levels`, {
        headers: this.getGameHeaders(),
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /** GET /api/game/levels/{levelId}/intro */
  getLevelIntro(levelId: string): Observable<LevelIntroVm> {
    console.log('=== GAME SERVICE GET LEVEL INTRO ===');
    console.log('Level ID:', levelId);
    return this.http
      .get<LevelIntroVm>(`${this.gameUrl}/levels/${levelId}/intro`, {
        headers: this.getGameHeaders(),
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /** POST /api/game/levels/{levelId}/start */
  startLevel(levelId: string): Observable<NextTaskResponse> {
    console.log('=== GAME SERVICE START LEVEL ===');
    console.log('Level ID:', levelId);
    return this.http
      .post<NextTaskResponse>(
        `${this.gameUrl}/levels/${levelId}/start`,
        {},
        {
          headers: this.getGameHeaders(),
        },
      )
      .pipe(catchError(this.handleError.bind(this)));
  }

  /** GET /api/game/levels/{levelId}/next */
  getNextTask(levelId: string): Observable<NextTaskResponse> {
    console.log('=== GAME SERVICE GET NEXT TASK ===');
    console.log('Level ID:', levelId);
    return this.http
      .get<NextTaskResponse>(`${this.gameUrl}/levels/${levelId}/next`, {
        headers: this.getGameHeaders(),
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /** POST /api/game/tasks/{taskId}/submit */
  submitTask(
    taskId: string,
    selectedOptionIds: string[],
    attemptToken: string,
  ): Observable<SubmitResponse> {
    console.log('=== GAME SERVICE SUBMIT TASK ===');
    console.log('Task ID:', taskId);
    console.log('Selected Option IDs:', selectedOptionIds);
    console.log('Attempt Token:', attemptToken);

    const idempotencyKey = this.generateIdempotencyKey();
    console.log('Idempotency Key:', idempotencyKey);

    return this.http
      .post<SubmitResponse>(
        `${this.gameUrl}/tasks/${taskId}/submit`,
        {
          // New API contract: send selectedOptionIds collection and attemptToken
          selectedOptionIds,
          attemptToken,
        },
        {
          headers: this.getGameHeaders({
            'Idempotency-Key': idempotencyKey,
          }),
        },
      )
      .pipe(catchError(this.handleError.bind(this)));
  }

  /** POST /api/game/levels/{levelId}/replay */
  replayLevel(levelId: string): Observable<NextTaskResponse | ReplayResponse> {
    console.log('=== GAME SERVICE REPLAY LEVEL ===');
    console.log('Level ID:', levelId);
    return this.http
      .post<NextTaskResponse | ReplayResponse>(
        `${this.gameUrl}/levels/${levelId}/replay`,
        {},
        {
          headers: this.getGameHeaders(),
        },
      )
      .pipe(catchError(this.handleError.bind(this)));
  }

  /** GET /api/game/leaderboard */
  getLeaderboard(
    period: string = 'AllTime',
    sectionId?: string,
    levelId?: string,
  ): Observable<LeaderboardEntryVm[]> {
    console.log('=== GAME SERVICE GET LEADERBOARD ===');
    console.log('Period:', period);
    console.log('Section ID:', sectionId);
    console.log('Level ID:', levelId);

    let url = `${this.gameUrl}/leaderboard?period=${period}`;
    if (sectionId) url += `&sectionId=${sectionId}`;
    if (levelId) url += `&levelId=${levelId}`;

    return this.http
      .get<LeaderboardEntryVm[]>(url, {
        headers: this.getGameHeaders(),
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  private handleError(error: any): Observable<never> {
    console.error('Game Service Error:', error);

    // Handle specific error cases
    if (error.status === 401) {
      // This will be handled by the auth interceptor
      return throwError(() => error);
    }

    if (error.status === 403) {
      // Level or task is locked - let components handle this
      return throwError(() => error);
    }

    if (error.status === 429) {
      // Replay cooldown - let components handle this
      return throwError(() => error);
    }

    // For other errors, just throw
    return throwError(() => error);
  }
}
