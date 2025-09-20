import { Injectable } from '@angular/core';

export interface Section {
  id: number;
  name: string;
  imagePath?: string;
  orderIndex: number; // порядок отображения
  status: number; // 0 = Чернетка, 1 = Опубліковано
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class SectionService {
  private sections: Section[] = [
    {
      id: 1,
      name: 'Географія',
      imagePath: '',
      orderIndex: 0,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      name: 'Політика',
      imagePath: '',
      orderIndex: 1,
      status: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  getSections(): Section[] {
    return this.sections;
  }

  getSectionById(id: number): Section | undefined {
    return this.sections.find((s) => s.id === id);
  }

  addSection(data: Partial<Section>) {
    const now = new Date();
    const newSection: Section = {
      id: Date.now(),
      name: data.name ?? '',
      imagePath: data.imagePath ?? '',
      orderIndex: data.orderIndex ?? 0,
      status: data.status ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.sections.push(newSection);
  }

  updateSection(id: number, data: Partial<Section>) {
    const s = this.sections.find((x) => x.id === id);
    if (!s) return;
    s.name = data.name ?? s.name;
    s.imagePath = data.imagePath ?? s.imagePath;
    s.orderIndex = data.orderIndex ?? s.orderIndex;
    s.status = data.status ?? s.status;
    s.updatedAt = new Date();
  }

  deleteSection(id: number) {
    this.sections = this.sections.filter((s) => s.id !== id);
  }
}
