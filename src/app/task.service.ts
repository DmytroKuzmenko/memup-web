import { Injectable } from '@angular/core';

export type TaskType = 'anagram' | 'image_choice' | 'text_choice';

export interface TaskOption {
  label: string;
  isCorrect: boolean;
  imageUrl?: string;
}

export interface Task {
  id: number;
  levelId: number;
  title: string; // internal name
  type: TaskType;
  topText?: string;
  taskImagePath?: string;
  taskImageSource?: string;
  resultImagePath?: string;
  resultImageSource?: string;
  orderIndex?: number;
  status: number; // 0 draft, 1 published
  timeLimitSeconds?: number;
  pointsFirst?: number;
  pointsSecond?: number;
  pointsThird?: number;
  explanationText?: string;

  // anagram
  charsCsv?: string;
  correctAnswer?: string;

  // image_choice / text_choice
  options?: TaskOption[];

  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private tasks: Task[] = [
    {
      id: 5001,
      levelId: 101,
      title: 'Basic terms #1',
      type: 'text_choice',
      status: 1,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      options: [
        { label: 'A', isCorrect: true },
        { label: 'B', isCorrect: false },
      ],
    },
    {
      id: 5002,
      levelId: 101,
      title: 'Compose city',
      type: 'anagram',
      status: 0,
      orderIndex: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      charsCsv: 'B,E,R,L,I,N',
      correctAnswer: 'BERLIN',
    },
  ];

  getTasks(levelId?: number): Task[] {
    return levelId ? this.tasks.filter((t) => t.levelId === levelId) : this.tasks.slice();
  }

  getTaskById(id: number): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  addTask(data: Partial<Task>) {
    const now = new Date();
    const t: Task = {
      id: Date.now(),
      levelId: data.levelId ?? 0,
      title: data.title ?? '',
      type: data.type ?? 'text_choice',
      topText: data.topText,
      taskImagePath: data.taskImagePath,
      taskImageSource: data.taskImageSource,
      resultImagePath: data.resultImagePath,
      resultImageSource: data.resultImageSource,
      orderIndex: data.orderIndex,
      status: data.status ?? 0,
      timeLimitSeconds: data.timeLimitSeconds,
      pointsFirst: data.pointsFirst,
      pointsSecond: data.pointsSecond,
      pointsThird: data.pointsThird,
      explanationText: data.explanationText,
      charsCsv: data.charsCsv,
      correctAnswer: data.correctAnswer,
      options: data.options ?? [],
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.push(t);
  }

  updateTask(id: number, data: Partial<Task>) {
    const t = this.tasks.find((x) => x.id === id);
    if (!t) return;
    t.levelId = data.levelId ?? t.levelId;
    t.title = data.title ?? t.title;
    t.type = data.type ?? t.type;
    t.topText = data.topText ?? t.topText;
    t.taskImagePath = data.taskImagePath ?? t.taskImagePath;
    t.taskImageSource = data.taskImageSource ?? t.taskImageSource;
    t.resultImagePath = data.resultImagePath ?? t.resultImagePath;
    t.resultImageSource = data.resultImageSource ?? t.resultImageSource;
    t.orderIndex = data.orderIndex ?? t.orderIndex;
    t.status = data.status ?? t.status;
    t.timeLimitSeconds = data.timeLimitSeconds ?? t.timeLimitSeconds;
    t.pointsFirst = data.pointsFirst ?? t.pointsFirst;
    t.pointsSecond = data.pointsSecond ?? t.pointsSecond;
    t.pointsThird = data.pointsThird ?? t.pointsThird;
    t.explanationText = data.explanationText ?? t.explanationText;
    t.charsCsv = data.charsCsv ?? t.charsCsv;
    t.correctAnswer = data.correctAnswer ?? t.correctAnswer;
    t.options = data.options ?? t.options;
    t.updatedAt = new Date();
  }

  deleteTask(id: number) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }
}
