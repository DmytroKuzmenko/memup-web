import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { GameService } from '../../services/game.service';
import { LevelVm, LevelStatus } from '../../shared/models/game.models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NotificationService } from '../../shared/services/notification.service';
import { LanguageService } from '../../shared/services/language.service';

@Component({
  selector: 'app-levels-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './levels-list.component.html',
  styleUrls: ['./levels-list.component.scss'],
})
export class LevelsListComponent implements OnInit {
  levels: LevelVm[] = [];
  sectionId: string = '';
  loading = true;
  error: string | null = null;
  showLockedModal = false;

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute,
    public router: Router,
    private notification: NotificationService,
    private languageService: LanguageService,
  ) {}

  ngOnInit(): void {
    // Прокрутка к верху страницы
    window.scrollTo(0, 0);

    this.route.params.subscribe((params) => {
      this.sectionId = params['id'];
      if (this.sectionId) {
        this.loadLevels();
      }
    });
  }

  loadLevels(): void {
    this.loading = true;
    this.error = null;

    this.gameService.getLevels(this.sectionId).subscribe({
      next: (levels) => {
        this.levels = levels;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading levels:', error);
        this.loading = false;

        // Handle specific error cases
        if (error.status === 401) {
          this.error = 'Please log in to view levels';
          // Не показываем уведомление, просто показываем ошибку в UI
        } else if (error.status === 403) {
          this.error = 'This section is locked.';
        } else {
          this.error = 'levels.error';
        }
      },
    });
  }

  getProgressPercentage(level: LevelVm): number {
    if (level.maxScore === 0) return 0;
    return (level.score / level.maxScore) * 100;
  }

  isLevelLocked(level: LevelVm): boolean {
    return level.status === 'Locked';
  }

  isLevelCompleted(level: LevelVm): boolean {
    return level.status === 'Completed';
  }

  isLevelInProgress(level: LevelVm): boolean {
    return level.status === 'InProgress';
  }

  onLevelClick(level: LevelVm): void {
    if (this.isLevelLocked(level)) {
      this.showLockedLevelMessage();
      return;
    }

    // Navigate to level intro
    this.router.navigate(['/levels', level.id, 'intro']);
  }

  private showLockedLevelMessage(): void {
    this.showLockedModal = true;
  }

  closeLockedModal(): void {
    this.showLockedModal = false;
  }

  getLevelStatusIcon(level: LevelVm): string {
    switch (level.status) {
      case 'Completed':
        return '✓';
      case 'InProgress':
        return '▶';
      case 'Locked':
        return '🔒';
      default:
        return '○';
    }
  }

  getLevelStatusClass(level: LevelVm): string {
    return `level-status-${level.status.toLowerCase()}`;
  }
}
