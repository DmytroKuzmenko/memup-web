import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SurveyApiService } from '../../services/survey-api.service';
import { SurveyListItem } from '../../shared/models/survey.models';

@Component({
  selector: 'app-survey-admin-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './survey-admin-list.component.html',
  styleUrls: ['./survey-admin-list.component.scss'],
})
export class SurveyAdminListComponent implements OnInit {
  private readonly surveyApi = inject(SurveyApiService);

  surveys: SurveyListItem[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    this.loadSurveys();
  }

  loadSurveys(): void {
    this.loading = true;
    this.error = null;

    this.surveyApi.adminListSurveys().subscribe({
      next: (surveys) => {
        this.surveys = surveys;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          this.error = 'Access denied';
        } else {
          this.error = 'Failed to load surveys';
        }
      },
    });
  }
}
