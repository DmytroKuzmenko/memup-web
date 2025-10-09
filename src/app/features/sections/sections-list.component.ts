import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GameService } from '../../services/game.service';
import { SectionVm } from '../../shared/models/game.models';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-sections-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './sections-list.component.html',
  styleUrls: ['./sections-list.component.scss'],
})
export class SectionsListComponent implements OnInit {
  sections: SectionVm[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private gameService: GameService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    // Прокрутка к верху страницы
    window.scrollTo(0, 0);
    this.loadSections();
  }

  loadSections(): void {
    this.loading = true;
    this.error = null;

    this.gameService.getSections().subscribe({
      next: (sections) => {
        this.sections = sections;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sections:', error);
        this.loading = false;

        // Handle specific error cases
        if (error.status === 401) {
          this.error = 'Please log in to view sections';
          // Не показываем уведомление, просто показываем ошибку в UI
        } else if (error.status === 403) {
          this.error = 'This section is locked.';
        } else {
          this.error = 'sections.error';
        }
      },
    });
  }

  getProgressPercentage(section: SectionVm): number {
    if (section.totalLevels === 0) return 0;
    return (section.levelsCompleted / section.totalLevels) * 100;
  }

  getScorePercentage(section: SectionVm): number {
    if (section.maxScore === 0) return 0;
    return (section.score / section.maxScore) * 100;
  }
}
