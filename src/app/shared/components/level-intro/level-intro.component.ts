import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../../services/game.service';
import { LevelIntroVm } from '../../models/game.models';
import { NotificationService } from '../../services/notification.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-level-intro',
  templateUrl: './level-intro.component.html',
  styleUrls: ['./level-intro.component.scss'],
  imports: [CommonModule, TranslatePipe],
})
export class LevelIntroComponent implements OnInit {
  @Input() phrase = 'Bitte warten...';
  @Output() introDone = new EventEmitter<void>();

  state: 'idle' | 'move' | 'hidden' = 'idle';
  buttonVisible = true;
  levelIntro: LevelIntroVm | null = null;
  loading = true;
  error: string | null = null;
  levelId: string = '';
  replayCooldown: string | null = null;
  animationImageUrl: string = 'assets/zug.png'; // Default fallback
  levelStartResponse: any = null;

  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService) as NotificationService;

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.levelId = params['id'];
      if (this.levelId) {
        this.loadLevelIntro();
      }
    });
  }

  loadLevelIntro(): void {
    this.loading = true;
    this.error = null;

    this.gameService.getLevelIntro(this.levelId).subscribe({
      next: (intro: LevelIntroVm) => {
        this.levelIntro = intro;
        this.phrase = intro.headerText || 'Bitte warten...';
        this.animationImageUrl = intro.animationImageUrl || 'assets/zug.png';
        this.loading = false;

        // Check if replay is available
        if (intro.replayAvailableAt) {
          this.checkReplayCooldown(intro.replayAvailableAt);
        }
      },
      error: (error: any) => {
        console.error('Error loading level intro:', error);
        this.loading = false;

        // Handle specific error cases
        if (error.status === 401) {
          this.error = 'Please log in to view this level';
          // Не показываем уведомление, просто показываем ошибку в UI
        } else if (error.status === 403) {
          this.error = 'locked';
        } else {
          this.error = 'Failed to load level intro';
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

  startLevel() {
    if (!this.levelIntro) return;

    this.buttonVisible = false; // Hide button
    this.state = 'move';

    // Call the start API
    this.gameService.startLevel(this.levelId).subscribe({
      next: (response: any) => {
        // Store the response for later navigation
        this.levelStartResponse = response;
      },
      error: (error: any) => {
        console.error('Error starting level:', error);
        this.buttonVisible = true; // Show button again
        this.state = 'idle';

        // Handle specific error cases
        if (error.status === 401) {
          this.notification.showError('Please log in to start this level');
        } else if (error.status === 403) {
          this.notification.showError('This level is locked.');
        } else if (error.status === 429) {
          this.notification.showError('Please wait before starting again.');
        } else {
          this.notification.showError('Failed to start level');
        }
      },
    });
  }

  onDeparted() {
    this.state = 'hidden';

    // Navigate to first task after animation completes
    if (this.levelStartResponse) {
      if (this.levelStartResponse.task) {
        // Navigate to task view
        this.router.navigate(['/levels', this.levelId, 'play']);
      } else {
        this.notification.showError('No task available');
      }
    }

    this.introDone.emit();
  }

  ngAfterViewInit(): void {
    this.setViewportHeight();
    window.addEventListener('resize', this.setViewportHeight.bind(this));
  }

  setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  // Error handling methods
  getErrorIcon(): string {
    switch (this.error) {
      case 'locked':
        return '🔒';
      case 'Please log in to view this level':
        return '🔑';
      default:
        return '⚠️';
    }
  }

  getErrorIconClass(): string {
    switch (this.error) {
      case 'locked':
        return 'error-icon-locked';
      case 'Please log in to view this level':
        return 'error-icon-auth';
      default:
        return 'error-icon-general';
    }
  }

  getErrorTitle(): string {
    switch (this.error) {
      case 'locked':
        return 'Level Locked';
      case 'Please log in to view this level':
        return 'Authentication Required';
      default:
        return 'Error';
    }
  }

  getErrorMessage(): string {
    switch (this.error) {
      case 'locked':
        return 'This level is currently locked. Complete the previous levels to unlock it.';
      case 'Please log in to view this level':
        return 'Please log in to your account to access this level.';
      default:
        return 'Something went wrong while loading the level. Please try again.';
    }
  }

  goBackToLevels(): void {
    this.router.navigate(['/levels']);
  }
}
