import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../shared/app-config';
import { SurveyDefinition, SurveyListItem, SurveyResponsePayload } from '../shared/models/survey.models';

@Injectable({ providedIn: 'root' })
export class SurveyApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject<AppConfig>(APP_CONFIG).apiBaseUrl;

  /** Authenticated: list published surveys */
  getSurveys(): Observable<SurveyListItem[]> {
    return this.http.get<SurveyListItem[]>(`${this.base}/surveys`);
  }

  /** Authenticated: load specific survey */
  getSurvey(id: string): Observable<SurveyDefinition> {
    return this.http.get<SurveyDefinition>(`${this.base}/surveys/${id}`);
  }

  /** Authenticated: submit answers for survey */
  submitResponse(surveyId: string, payload: SurveyResponsePayload): Observable<void> {
    return this.http.post<void>(`${this.base}/surveys/${surveyId}/responses`, payload);
  }

  /** Admin-only: list all surveys including hidden */
  adminListSurveys(): Observable<SurveyListItem[]> {
    return this.http.get<SurveyListItem[]>(`${this.base}/surveys/admin/list`);
  }

  /** Admin-only: save survey JSON definition */
  adminSaveSurvey(surveyId: string, jsonString: string): Observable<void> {
    let body: unknown = jsonString;

    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // ensure the payload includes the survey id expected by the API
        const parsedObj = parsed as Record<string, unknown>;
        if (parsedObj['surveyId'] === undefined) {
          parsedObj['surveyId'] = surveyId;
        }
      }
      body = parsed;
    } catch {
      body = jsonString;
    }

    return this.http.post<void>(`${this.base}/surveys/admin/save`, body, {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
