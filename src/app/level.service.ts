import { Injectable } from '@angular/core';

export interface Level {
  id: number;
  sectionId: number;
  name: string;
  imagePath?: string; // картинка уровня
  prefaceText?: string; // фраза перед рівнем
  animationImagePath?: string; // анімація (gif/webp) ліворуч направо
  orderIndex?: number;
  status: number; // 0 чернетка, 1 опубліковано
  timeLimitSeconds?: number; // таймер, опційно
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class LevelService {
  private levels: Level[] = [
    {
      id: 101,
      sectionId: 1,
      name: 'Берлін',
      imagePath: '',
      status: 1,
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 102,
      sectionId: 1,
      name: 'Бранденбург',
      imagePath: '',
      status: 0,
      orderIndex: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 201,
      sectionId: 2,
      name: 'Основи',
      imagePath: '',
      status: 1,
      orderIndex: 0,
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
    const l: Level = {
      id: Date.now(),
      sectionId: data.sectionId ?? 0,
      name: data.name ?? '',
      imagePath: data.imagePath ?? '',
      prefaceText: data.prefaceText ?? '',
      animationImagePath: data.animationImagePath ?? '',
      orderIndex: data.orderIndex,
      status: data.status ?? 0,
      timeLimitSeconds: data.timeLimitSeconds,
      createdAt: now,
      updatedAt: now,
    };
    this.levels.push(l);
  }

  updateLevel(id: number, data: Partial<Level>) {
    const l = this.levels.find((x) => x.id === id);
    if (!l) return;
    l.sectionId = data.sectionId ?? l.sectionId;
    l.name = data.name ?? l.name;
    l.imagePath = data.imagePath ?? l.imagePath;
    l.prefaceText = data.prefaceText ?? l.prefaceText;
    l.animationImagePath = data.animationImagePath ?? l.animationImagePath;
    l.orderIndex = data.orderIndex ?? l.orderIndex;
    l.status = data.status ?? l.status;
    l.timeLimitSeconds = data.timeLimitSeconds ?? l.timeLimitSeconds;
    l.updatedAt = new Date();
  }

  deleteLevel(id: number) {
    this.levels = this.levels.filter((l) => l.id !== id);
  }
}
