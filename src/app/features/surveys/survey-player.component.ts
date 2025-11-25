import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SurveyApiService } from '../../services/survey-api.service';
import { SurveyDefinition, SurveyQuestionDefinition, SurveyResponsePayload } from '../../shared/models/survey.models';
import { NotificationService } from '../../shared/services/notification.service';
import { LanguageService } from '../../shared/services/language.service';

@Component({
  selector: 'app-survey-player',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey-player.component.html',
  styleUrls: ['./survey-player.component.scss'],
})
export class SurveyPlayerComponent implements OnInit, OnDestroy {
  private readonly surveyApi = inject(SurveyApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);
  private readonly languageService = inject(LanguageService);

  survey = signal<SurveyDefinition | null>(null);
  loading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  thankYou = signal(false);
  thankYouTitle = signal('');
  thankYouMessage = signal('');
  currentIndex = signal(0);
  answers = signal<Record<string, string | number>>({});

  currentQuestion = computed<SurveyQuestionDefinition | undefined>(() => {
    const survey = this.survey();
    if (!survey) return undefined;
    return survey.questions[this.currentIndex()];
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const surveyId = params.get('surveyId');
      if (surveyId) {
        this.resetState();
        this.loadSurvey(surveyId);
      }
    });
  }

  ngOnDestroy(): void {
    this.loading.set(false);
    this.submitting.set(false);
  }

  get progressText(): string {
    const survey = this.survey();
    if (!survey) return '';
    return `Question ${this.currentIndex() + 1} of ${survey.questions.length}`;
  }

  get progressPercentage(): number {
    const totalQuestions = Math.max(this.survey()?.questions.length ?? 0, 1);
    return ((this.currentIndex() + 1) / totalQuestions) * 100;
  }

  get isLastQuestion(): boolean {
    const survey = this.survey();
    if (!survey) return false;
    return this.currentIndex() === survey.questions.length - 1;
  }

  goBack(): void {
    if (this.currentIndex() === 0 || this.loading()) return;
    this.currentIndex.update((value) => value - 1);
  }

  next(): void {
    if (this.submitting() || this.loading()) return;
    if (!this.isCurrentAnswered()) {
      this.notification.showError('Please answer before continuing.');
      return;
    }

    if (this.isLastQuestion) {
      this.submitSurvey();
      return;
    }

    this.currentIndex.update((value) => value + 1);
  }

  setSingleChoice(questionId: string, value: string): void {
    this.answers.update((prev) => ({ ...prev, [questionId]: value }));
  }

  setScaleAnswer(questionId: string, value: number): void {
    this.answers.update((prev) => ({ ...prev, [questionId]: value }));
  }

  setTextAnswer(questionId: string, value: string): void {
    this.answers.update((prev) => ({ ...prev, [questionId]: value }));
  }

  isCurrentAnswered(): boolean {
    const question = this.currentQuestion();
    if (!question) return false;
    const answer = this.answers()[question.id];

    if (question.type === 'short-text') {
      return typeof answer === 'string' && answer.trim().length > 0;
    }

    return answer !== undefined && answer !== null && `${answer}`.length > 0;
  }

  trackByOption = (_: number, option: string) => option;
  trackByNumber = (_: number, value: number) => value;

  getScaleValues(question: SurveyQuestionDefinition): number[] {
    const min = question.scaleMin ?? 1;
    const max = question.scaleMax ?? 5;
    if (max < min) {
      return [];
    }

    return Array.from({ length: max - min + 1 }, (_, idx) => min + idx);
  }

  getTextAnswer(questionId: string): string {
    const answer = this.answers()[questionId];
    if (typeof answer === 'string') {
      return answer;
    }

    return answer !== undefined && answer !== null ? String(answer) : '';
  }

  private loadSurvey(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.surveyApi.getSurvey(id).subscribe({
      next: (definition) => {
        this.survey.set(definition);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.error.set('Survey not found');
        } else if (err.status === 401) {
          this.error.set('Please sign in to continue');
        } else if (err.status === 409) {
          const title = this.languageService.translate('surveys.thankYou.title');
          const message = this.languageService.translate('surveys.thankYou.alreadySubmitted');
          this.thankYouTitle.set(title);
          this.thankYouMessage.set(message);
          this.thankYou.set(true);
          this.error.set(null);
        } else {
          this.error.set('Failed to load survey');
        }
      },
    });
  }

  private submitSurvey(): void {
    const survey = this.survey();
    if (!survey) return;

    const payload: SurveyResponsePayload = {
      surveyId: survey.surveyId,
      answers: Object.entries(this.answers()).map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
    };

    this.submitting.set(true);
    this.surveyApi.submitResponse(survey.surveyId, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.thankYouTitle.set(this.languageService.translate('surveys.thankYou.title'));
        this.thankYouMessage.set(this.languageService.translate('surveys.thankYou.submitted'));
        this.thankYou.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        if (err.status === 401) {
          this.error.set('Please sign in to continue');
        } else if (err.status === 403) {
          this.error.set('You are not allowed to submit this survey');
        } else if (err.status === 409) {
          const title = this.languageService.translate('surveys.thankYou.title');
          const message = this.languageService.translate('surveys.thankYou.alreadySubmitted');
          this.thankYouTitle.set(title);
          this.thankYouMessage.set(message);
          this.thankYou.set(true);
          this.error.set(null);
        } else {
          this.error.set('Failed to submit survey');
        }
      },
    });
  }

  private resetState(): void {
    this.survey.set(null);
    this.currentIndex.set(0);
    this.answers.set({});
    this.loading.set(false);
    this.submitting.set(false);
    this.error.set(null);
    this.thankYou.set(false);
    this.thankYouTitle.set(this.languageService.translate('surveys.thankYou.title'));
    this.thankYouMessage.set(this.languageService.translate('surveys.thankYou.submitted'));
  }
}
