import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SurveyApiService } from '../../services/survey-api.service';
import { SurveyDefinition } from '../../shared/models/survey.models';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-survey-admin-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey-admin-editor.component.html',
  styleUrls: ['./survey-admin-editor.component.scss'],
})
export class SurveyAdminEditorComponent implements OnInit {
  private readonly surveyApi = inject(SurveyApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);

  surveyId: string | null = null;
  jsonText = signal('');
  preview = signal<SurveyDefinition | null>(null);
  validationError = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.surveyId = params.get('surveyId');
      if (this.surveyId) {
        this.fetchSurvey(this.surveyId);
      }
    });
  }

  onJsonChange(value: string): void {
    this.jsonText.set(value);
    this.updatePreview();
  }

  save(): void {
    if (!this.surveyId) return;

    const parsed = this.updatePreview();
    if (!parsed) {
      return;
    }

    this.saving.set(true);
    this.surveyApi.adminSaveSurvey(this.surveyId, this.jsonText()).subscribe({
      next: () => {
        this.saving.set(false);
        this.notification.showSuccess('Survey saved');
      },
      error: (err) => {
        this.saving.set(false);
        if (err.status === 403) {
          this.notification.showError('Not authorized to save');
        } else {
          this.notification.showError('Failed to save survey');
        }
      },
    });
  }

  private fetchSurvey(id: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.surveyApi.getSurvey(id).subscribe({
      next: (definition) => {
        this.jsonText.set(JSON.stringify(definition, null, 2));
        this.preview.set(definition);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.loadError.set('Survey not found');
        } else if (err.status === 403) {
          this.loadError.set('Not authorized to view this survey');
        } else {
          this.loadError.set('Failed to load survey');
        }
      },
    });
  }

  private updatePreview(): SurveyDefinition | null {
    try {
      const parsed = JSON.parse(this.jsonText()) as SurveyDefinition;
      this.preview.set(parsed);
      this.validationError.set(null);
      return parsed;
    } catch (err) {
      this.preview.set(null);
      this.validationError.set((err as Error).message);
      return null;
    }
  }
}
