import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { LeaderboardEntryVm } from '../../shared/models/game.models';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit {
  leaderboard: LeaderboardEntryVm[] = [];
  loading = true;
  error: string | null = null;

  // Filter options
  periods = [
    { value: 'AllTime', label: 'All Time' },
    { value: 'ThisWeek', label: 'This Week' },
    { value: 'ThisMonth', label: 'This Month' },
  ];

  selectedPeriod = 'AllTime';
  selectedSectionId: string = '';
  selectedLevelId: string = '';

  constructor(
    private gameService: GameService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.loading = true;
    this.error = null;

    this.gameService
      .getLeaderboard(
        this.selectedPeriod,
        this.selectedSectionId || undefined,
        this.selectedLevelId || undefined,
      )
      .subscribe({
        next: (entries) => {
          this.leaderboard = entries;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading leaderboard:', error);
          this.error = 'Failed to load leaderboard';
          this.loading = false;

          if (error.status === 403) {
            this.notification.showError('Access denied to leaderboard.');
          }
        },
      });
  }

  onPeriodChange(): void {
    this.loadLeaderboard();
  }

  onSectionChange(): void {
    this.selectedLevelId = ''; // Reset level when section changes
    this.loadLeaderboard();
  }

  onLevelChange(): void {
    this.loadLeaderboard();
  }

  onRefresh(): void {
    this.loadLeaderboard();
  }

  getRankIcon(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  }

  getRankClass(rank: number): string {
    if (rank <= 3) return 'top-three';
    if (rank <= 10) return 'top-ten';
    return 'regular';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatScore(score: number): string {
    return score.toLocaleString();
  }
}
