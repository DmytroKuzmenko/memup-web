import { Injectable } from '@angular/core';
import { UserProgress, getDefaultProgress, LevelProgress } from '../mock/user-progress.mock';

const PROGRESS_KEY = 'memeup-progress';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  getProgress(): UserProgress {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch { /* ignore */ }
    }
    return getDefaultProgress();
  }

  saveProgress(progress: UserProgress) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  completeLevel(levelId: number, score: number) {
    const progress = this.getProgress();
    const found = progress.levels.find(l => l.levelId === levelId);
    if (found) {
      found.completed = true;
      found.score = Math.max(found.score, score);
    } else {
      progress.levels.push({ levelId, completed: true, score });
    }
    this.saveProgress(progress);
  }

  addAchievement(key: string) {
    const progress = this.getProgress();
    if (!progress.achievements.includes(key)) {
      progress.achievements.push(key);
      this.saveProgress(progress);
    }
  }

  reset() {
    localStorage.removeItem(PROGRESS_KEY);
  }
}