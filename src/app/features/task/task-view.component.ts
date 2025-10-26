import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { TaskVm, SubmitResponse, NextTaskResponse } from '../../shared/models/game.models';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-task-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss'],
})
export class TaskViewComponent implements OnInit, OnDestroy {
  task: TaskVm | null = null;
  levelId: string = '';
  // Support multiple selected option ids
  selectedOptionIds: Set<string> = new Set<string>();
  timeRemaining: number = 0;
  timerInterval: any = null;
  submitting = false;
  showingExplanation = false;
  explanationText: string = '';
  loading = true;
  error: string | null = null;

  private gameService = inject(GameService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.levelId = params['id'];
      if (this.levelId) {
        this.loadCurrentTask();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadCurrentTask(): void {
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
          this.router.navigate(['/levels', this.levelId, 'summary']);
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
    if (this.selectedOptionIds.has(optionId)) {
      this.selectedOptionIds.delete(optionId);
    } else {
      this.selectedOptionIds.add(optionId);
    }
  }

  onSubmit(): void {
    if (!this.task || this.selectedOptionIds.size === 0 || this.submitting) return;

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
      this.showingExplanation = true;
      this.explanationText = response.explanationText || '';

      if (response.levelCompleted) {
        // Level completed, navigate to summary
        setTimeout(() => {
          this.router.navigate(['/levels', this.levelId, 'summary']);
        }, 3000);
      }
    } else if (response.result === 'incorrect') {
      if (response.attemptsLeft > 0) {
        this.notification.showError('Try again!');
        this.loadCurrentTask(); // Get next task with fresh token
      } else {
        this.notification.showError('No attempts left');
        this.loadCurrentTask(); // Get next task
      }
    } else if (response.result === 'timeout') {
      this.notification.showError("Time's up!");
      this.loadCurrentTask(); // Get next task
    }
  }

  onContinue(): void {
    if (this.showingExplanation) {
      this.showingExplanation = false;
      this.loadCurrentTask(); // Get next task
    }
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
}
