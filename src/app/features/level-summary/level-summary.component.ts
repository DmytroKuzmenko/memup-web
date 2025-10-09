import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { LevelIntroVm, NextTaskResponse } from '../../shared/models/game.models';
import { NotificationService } from '../../shared/services/notification.service';

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

  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);

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

    this.gameService.getLevelIntro(this.levelId).subscribe({
      next: (intro) => {
        this.levelIntro = intro;
        this.earnedScore = intro.maxScore; // This should come from the submit response
        this.maxScore = intro.maxScore;
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
    if (!this.levelId) return;

    this.gameService.replayLevel(this.levelId).subscribe({
      next: (response) => {
        if ('retryAfter' in response) {
          // 429 response - cooldown
          this.notification.showError(
            `Replay available in ${this.formatTime(Math.ceil(new Date(response.retryAfter || '').getTime() / 1000))}`,
          );
        } else {
          // Success - navigate to task view
          this.router.navigate(['/levels', this.levelId, 'play']);
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
        } else {
          this.notification.showError('Failed to replay level');
        }
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
}
