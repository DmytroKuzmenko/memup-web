import { Injectable } from '@angular/core';

export interface Level {
  id: number;
  sectionId: number; // связь с разделом
  name: string; // напр.: "A1", "Basics"
  orderIndex?: number;
  status: number; // 0 = Draft, 1 = Published
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class LevelService {
  private levels: Level[] = [
    // примеры под твои существующие разделы (id: 1 Geography, id: 2 Politics)
    { id: 101, sectionId: 1, name: 'A1', status: 1, createdAt: new Date(), updatedAt: new Date() },
    { id: 102, sectionId: 1, name: 'A2', status: 0, createdAt: new Date(), updatedAt: new Date() },
    {
      id: 201,
      sectionId: 2,
      name: 'Basics',
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  getLevels(sectionId?: number): Level[] {
    return sectionId ? this.levels.filter((l) => l.sectionId === sectionId) : this.levels;
  }

  getLevelById(id: number): Level | undefined {
    return this.levels.find((l) => l.id === id);
  }

  addLevel(data: Partial<Level>) {
    const now = new Date();
    const newLevel: Level = {
      id: Date.now(),
      sectionId: data.sectionId ?? 0,
      name: data.name ?? '',
      orderIndex: data.orderIndex,
      status: data.status ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.levels.push(newLevel);
  }

  updateLevel(id: number, data: Partial<Level>) {
    const l = this.levels.find((x) => x.id === id);
    if (l) {
      l.sectionId = data.sectionId ?? l.sectionId;
      l.name = data.name ?? l.name;
      l.orderIndex = data.orderIndex ?? l.orderIndex;
      l.status = data.status ?? l.status;
      l.updatedAt = new Date();
    }
  }

  deleteLevel(id: number) {
    this.levels = this.levels.filter((l) => l.id !== id);
  }
}
