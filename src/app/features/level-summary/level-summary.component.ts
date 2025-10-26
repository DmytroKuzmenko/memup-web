import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { LevelIntroVm } from '../../shared/models/game.models';
import { NotificationService } from '../../shared/services/notification.service';

type LevelSummaryNavigationState = {
  earnedScore?: number;
  maxScore?: number;
};

@Component({
  selector: 'app-level-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './level-summary.component.html',
  styleUrls: ['./level-summary.component.scss'],
})
export class LevelSummaryComponent implements OnInit {
  levelIntro: LevelIntroVm | null = null;
  levelId: string = '';
  earnedScore: number = 0;
  maxScore: number = 0;
  loading = true;
  error: string | null = null;
  replayCooldown: string | null = null;
  replayInProgress = false;

  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private summaryState: LevelSummaryNavigationState | null = null;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.levelId = params['id'];
      if (this.levelId) {
        this.loadLevelSummary();
      }
    });
  }

  loadLevelSummary(): void {
    this.loading = true;
    this.error = null;
    this.summaryState = this.extractSummaryState();

    this.gameService.getLevelIntro(this.levelId).subscribe({
      next: (intro) => {
        this.levelIntro = intro;
        const summaryState = this.summaryState;

        this.maxScore = summaryState?.maxScore ?? intro.maxScore;
        this.earnedScore =
          summaryState?.earnedScore !== undefined ? summaryState.earnedScore : this.maxScore;
        this.loading = false;

        // Check if replay is available
        if (intro.replayAvailableAt) {
          this.checkReplayCooldown(intro.replayAvailableAt);
        }
      },
      error: (error) => {
        console.error('Error loading level summary:', error);
        this.error = 'Failed to load level summary';
        this.loading = false;

        if (error.status === 403) {
          this.notification.showError('This level is locked.');
        }
      },
    });
  }

  checkReplayCooldown(replayAvailableAt: string): void {
    const now = new Date();
    const availableAt = new Date(replayAvailableAt);

    if (now < availableAt) {
      const diffMs = availableAt.getTime() - now.getTime();
      const diffSeconds = Math.ceil(diffMs / 1000);
      this.replayCooldown = this.formatTime(diffSeconds);

      // Update countdown every second
      const interval = setInterval(() => {
        const remainingMs = availableAt.getTime() - new Date().getTime();
        if (remainingMs <= 0) {
          this.replayCooldown = null;
          clearInterval(interval);
        } else {
          const remainingSeconds = Math.ceil(remainingMs / 1000);
          this.replayCooldown = this.formatTime(remainingSeconds);
        }
      }, 1000);
    }
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  onReplay(): void {
    if (!this.levelId || this.replayInProgress) return;

    this.replayInProgress = true;

    const navigateToLevel = () => {
      this.replayInProgress = false;
      this.router.navigate(['/levels', this.levelId, 'play']);
    };

    const handleFallbackStart = () => {
      this.gameService.startLevel(this.levelId).subscribe({
        next: () => navigateToLevel(),
        error: (startError) => {
          console.error('Error starting level after replay failure:', startError);
          this.replayInProgress = false;

          if (startError.status === 429) {
            const retryAfter = startError.error?.retryAfter;
            if (retryAfter) {
              this.notification.showError(
                `Replay available in ${this.formatTime(Math.ceil(new Date(retryAfter).getTime() / 1000))}`,
              );
            } else {
              this.notification.showError('Please wait before replaying.');
            }
          } else {
            this.notification.showError('Failed to replay level');
          }
        },
      });
    };

    this.gameService.replayLevel(this.levelId).subscribe({
      next: (response) => {
        if ('retryAfter' in response) {
          // 429 response - cooldown
          this.replayInProgress = false;
          this.notification.showError(
            `Replay available in ${this.formatTime(Math.ceil(new Date(response.retryAfter || '').getTime() / 1000))}`,
          );
        } else {
          // Success - navigate to task view
          navigateToLevel();
        }
      },
      error: (error) => {
        console.error('Error replaying level:', error);

        if (error.status === 429) {
          const retryAfter = error.error?.retryAfter;
          if (retryAfter) {
            this.notification.showError(
              `Replay available in ${this.formatTime(Math.ceil(new Date(retryAfter).getTime() / 1000))}`,
            );
          } else {
            this.notification.showError('Please wait before replaying.');
          }
          this.replayInProgress = false;
          return;
        }

        if (error.status === 400 && error.error?.message === 'Level has not been completed yet') {
          handleFallbackStart();
          return;
        }

        this.replayInProgress = false;
        this.notification.showError('Failed to replay level');
      },
    });
  }

  onNextLevel(): void {
    // Navigate back to levels list for the same section
    this.router.navigate(['/sections', this.levelIntro?.levelId]);
  }

  onBackToSections(): void {
    this.router.navigate(['/sections']);
  }

  getScorePercentage(): number {
    if (this.maxScore === 0) return 0;
    return (this.earnedScore / this.maxScore) * 100;
  }

  getScoreGrade(): string {
    const percentage = this.getScorePercentage();

    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  getScoreGradeColor(): string {
    const percentage = this.getScorePercentage();

    if (percentage >= 80) return '#059669';
    if (percentage >= 60) return '#d97706';
    return '#dc2626';
  }

  private extractSummaryState(): LevelSummaryNavigationState | null {
    const navigationState = this.router.getCurrentNavigation()?.extras?.state as
      | LevelSummaryNavigationState
      | undefined;
    if (this.hasSummaryValues(navigationState)) {
      return navigationState;
    }

    const historyState = history.state as LevelSummaryNavigationState | undefined;
    if (this.hasSummaryValues(historyState)) {
      return historyState;
    }

    return null;
  }

  private hasSummaryValues(
    state: LevelSummaryNavigationState | undefined,
  ): state is LevelSummaryNavigationState {
    return !!state && (state.earnedScore !== undefined || state.maxScore !== undefined);
  }
}
