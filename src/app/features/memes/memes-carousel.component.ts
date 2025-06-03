import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MEMES, Meme } from '../../mock/memes.mock';
import { TASKS, Task } from '../../mock/tasks.mock';
import { MatCardModule } from '@angular/material/card';
import { MemeTaskComponent } from './meme-task.component';
import { MatButtonModule } from '@angular/material/button';

interface MemeResult {
  memeId: number;
  points: number;
  answered: boolean;
}

@Component({
  selector: 'app-memes-carousel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MemeTaskComponent, MatButtonModule],
  templateUrl: './memes-carousel.component.html',
  styleUrls: ['./memes-carousel.component.scss']
})
export class MemesCarouselComponent {
  memes: Meme[] = [];
  currentIndex = 0;
  memeResults: MemeResult[] = [];
  finished = false;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.paramMap.subscribe(params => {
      const levelId = Number(params.get('id'));
      this.memes = MEMES
        .filter(m => m.levelId === levelId)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      this.currentIndex = 0;
      this.memeResults = this.memes.map(m => ({
        memeId: m.id,
        points: 0,
        answered: false
      }));
      this.finished = false;
    });
  }

  get currentTask(): Task | undefined {
    return this.memes.length
      ? TASKS.find(t => t.memeId === this.memes[this.currentIndex].id)
      : undefined;
  }

  // Принимаем событие о завершении задания (с количеством баллов)
  onTaskCompleted(points: number) {
    this.memeResults[this.currentIndex] = {
      memeId: this.memes[this.currentIndex].id,
      points,
      answered: true
    };
  }

  nextMeme() {
    if (this.currentIndex < this.memes.length - 1) {
      this.currentIndex++;
    } else {
      this.finished = true;
    }
  }

  prevMeme() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  get totalPoints() {
    return this.memeResults.reduce((sum, r) => sum + r.points, 0);
  }

  get maxPoints() {
    return this.memes
      .map(m => TASKS.find(t => t.memeId === m.id)?.basePoints || 0)
      .reduce((a, b) => a + b, 0);
  }

  retryLevel() {
    this.currentIndex = 0;
    this.memeResults = this.memes.map(m => ({
      memeId: m.id,
      points: 0,
      answered: false
    }));
    this.finished = false;
  }
}
