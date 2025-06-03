import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../mock/tasks.mock';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-meme-task',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  templateUrl: './meme-task.component.html',
  styleUrls: ['./meme-task.component.scss']
})
export class MemeTaskComponent {
  @Input() task!: Task;
  @Output() completed = new EventEmitter<number>(); // количество баллов за попытку

  selected: number | null = null;
  answered = false;
  showExplanation = false;

  choose(index: number) {
    if (this.answered) return;
    this.selected = index;
    this.answered = true;
    // Пример: полные баллы за первую попытку, половина — если сразу неверно (можешь расширить)
    const points = (index === this.task.correctAnswerIndex)
      ? this.task.basePoints
      : Math.floor(this.task.basePoints / 2);
    this.completed.emit(points);
  }

  openExplanation() {
    this.showExplanation = true;
  }

  reset() {
    this.selected = null;
    this.answered = false;
    this.showExplanation = false;
  }

  
}
