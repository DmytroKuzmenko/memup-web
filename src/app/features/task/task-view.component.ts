import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { TaskVm, SubmitResponse, LevelIntroVm } from '../../shared/models/game.models';
import { NotificationService } from '../../shared/services/notification.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-task-view',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss'],
})
export class TaskViewComponent implements OnInit, OnDestroy {
  task: TaskVm | null = null;
  levelId: string = '';
  levelIntro: LevelIntroVm | null = null;
  // Support multiple selected option ids
  selectedOptionIds: Set<string> = new Set<string>();
  correctOptionIds: Set<string> = new Set<string>();
  incorrectFeedback = false;
  incorrectMessage: string | null = null;
  timeRemaining: number = 0;
  timerInterval: any = null;
  submitting = false;
  showingExplanation = false;
  explanationText: string = '';
  loading = false;
  error: string | null = null;
  showIntro = false;
  introLoading = false;
  introError: string | null = null;
  animationPlaying = false;
  showAnimationImage = false;

  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private sanitizer = inject(DomSanitizer);
  private levelCompletionState: { earnedScore?: number; maxScore?: number } | null = null;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.levelId = params['id'];
      if (this.levelId) {
        this.prepareForNewLevel();
        this.loadLevelIntro();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadCurrentTask(): void {
    this.resetInteractionState();
    this.levelCompletionState = null;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.loading = true;
    this.error = null;

    this.gameService.getNextTask(this.levelId).subscribe({
      next: (response) => {
        if (response.task) {
          this.task = response.task;
          this.startTimer();
          this.loading = false;
        } else {
          // No more tasks, navigate to level summary
          const navigationExtras = response.levelProgress
            ? {
                state: {
                  earnedScore: response.levelProgress.score,
                  maxScore: response.levelProgress.maxScore,
                },
              }
            : undefined;

          this.router.navigate(['/levels', this.levelId, 'summary'], navigationExtras);
        }
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.error = 'Failed to load task';
        this.loading = false;

        if (error.status === 403) {
          this.notification.showError('This task is locked.');
        }
      },
    });
  }

  loadLevelIntro(): void {
    this.introLoading = true;
    this.introError = null;
    this.showIntro = true;
    this.levelIntro = null;
    this.gameService.getLevelIntro(this.levelId).subscribe({
      next: (intro) => {
        this.levelIntro = intro;
        this.introLoading = false;
      },
      error: (error) => {
        console.error('Error loading level intro:', error);
        this.introError = 'Не удалось загрузить данные уровня';
        this.introLoading = false;
      },
    });
  }

  onStartLevel(): void {
    if (this.introLoading || this.animationPlaying) {
      return;
    }

    if (this.levelIntro?.animationImageUrl) {
      this.animationPlaying = true;
      this.showAnimationImage = true;
    } else {
      this.finishIntro();
    }
  }

  onIntroAnimationDone(): void {
    if (!this.animationPlaying) {
      return;
    }

    this.animationPlaying = false;
    this.showAnimationImage = false;
    this.finishIntro();
  }

  onIntroAnimationError(): void {
    console.warn('Intro animation image failed to load. Skipping animation.');
    this.animationPlaying = false;
    this.showAnimationImage = false;
    this.finishIntro();
  }

  retryIntro(): void {
    if (this.introLoading) {
      return;
    }
    this.prepareForNewLevel();
    this.loadLevelIntro();
  }

  private finishIntro(): void {
    this.showIntro = false;
    this.loadCurrentTask();
  }

  private prepareForNewLevel(): void {
    this.resetInteractionState();
    this.task = null;
    this.levelIntro = null;
    this.introError = null;
    this.introLoading = false;
    this.showIntro = false;
    this.animationPlaying = false;
    this.showAnimationImage = false;
    this.loading = false;
    this.error = null;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  startTimer(): void {
    if (!this.task?.timeLimitSecEffective) return;

    this.timeRemaining = this.task.timeLimitSecEffective;

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      if (this.timeRemaining <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  handleTimeout(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.notification.showError("Time's up!");
    this.loadCurrentTask(); // Get next task
  }

  onOptionSelect(optionId: string): void {
    // kept for compatibility if some code calls it; toggle selection
    this.onOptionToggle(optionId);
  }

  onOptionToggle(optionId: string): void {
    if (this.incorrectFeedback || this.showingExplanation) return;

    if (this.selectedOptionIds.has(optionId)) {
      this.selectedOptionIds.delete(optionId);
    } else {
      this.selectedOptionIds.add(optionId);
    }
  }

  onSubmit(): void {
    if (!this.task || this.selectedOptionIds.size === 0 || this.submitting || this.incorrectFeedback) return;

    this.submitting = true;

    const selected = Array.from(this.selectedOptionIds);

    this.gameService.submitTask(this.task.id, selected, this.task.attemptToken).subscribe({
      next: (response: SubmitResponse) => {
        this.handleSubmitResponse(response);
      },
      error: (error) => {
        console.error('Error submitting task:', error);
        this.submitting = false;

        if (error.status === 403) {
          this.notification.showError('This task is locked.');
        } else {
          this.notification.showError('Failed to submit task');
        }
      },
    });
  }

  handleSubmitResponse(response: SubmitResponse): void {
    this.submitting = false;

    if (response.result === 'correct') {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.showingExplanation = true;
      this.explanationText = response.explanationText || '';
      const correctIds = response.correctOptionIds?.length
        ? response.correctOptionIds
        : Array.from(this.selectedOptionIds);
      this.correctOptionIds = new Set(correctIds);

      if (response.levelCompleted) {
        this.levelCompletionState = response.levelSummary
          ? {
              earnedScore: response.levelSummary.earnedScore,
              maxScore: response.levelSummary.maxScore,
            }
          : {};
      } else {
        this.levelCompletionState = null;
      }
    } else if (response.result === 'incorrect') {
      this.levelCompletionState = null;
      if (response.attemptsLeft > 0) {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        this.incorrectFeedback = true;
        this.incorrectMessage =
          response.attemptsLeft === 1
            ? 'Incorrect answer. You have 1 attempt remaining.'
            : `Incorrect answer. You have ${response.attemptsLeft} attempts remaining.`;
      } else {
        this.notification.showError('No attempts left');
        this.loadCurrentTask(); // Get next task
      }
    } else if (response.result === 'timeout') {
      this.levelCompletionState = null;
      this.notification.showError("Time's up!");
      this.loadCurrentTask(); // Get next task
    }
  }

  onContinue(): void {
    if (this.showingExplanation) {
      const summaryState = this.levelCompletionState;
      this.showingExplanation = false;
      this.correctOptionIds.clear();

      if (summaryState) {
        this.levelCompletionState = null;
        const navigationExtras = Object.keys(summaryState).length
          ? { state: summaryState }
          : undefined;
        this.router.navigate(['/levels', this.levelId, 'summary'], navigationExtras);
      } else {
        this.loadCurrentTask(); // Get next task
      }
    }
  }

  onTryAgain(): void {
    if (this.submitting || !this.task) return;

    this.resetInteractionState();
    this.loadCurrentTask();
  }

  private resetInteractionState(): void {
    this.selectedOptionIds.clear();
    this.incorrectFeedback = false;
    this.incorrectMessage = null;
    this.showingExplanation = false;
    this.explanationText = '';
    this.correctOptionIds.clear();
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  getTimerClass(): string {
    if (!this.task?.timeLimitSecEffective) return '';

    const percentage = (this.timeRemaining / this.task.timeLimitSecEffective) * 100;

    if (percentage <= 20) return 'timer-critical';
    if (percentage <= 40) return 'timer-warning';
    return 'timer-normal';
  }

  isOptionCorrect(optionId: string): boolean {
    return this.correctOptionIds.has(optionId);
  }

  get displayedImageUrl(): string | null {
    if (!this.task) return null;
    if (this.showingExplanation && this.task.resultImagePath) {
      return this.task.resultImagePath;
    }
    return this.task.imageUrl || null;
  }

  get displayedImageSource(): SafeHtml | null {
    if (!this.task) return null;
    if (this.showingExplanation && this.task.resultImagePath) {
      return this.toSafeHtml(this.task.resultImageSource);
    }
    return this.toSafeHtml(this.task.taskImageSource);
  }

  private toSafeHtml(value: string | null | undefined): SafeHtml | null {
    return value ? this.sanitizer.bypassSecurityTrustHtml(value) : null;
  }
}
