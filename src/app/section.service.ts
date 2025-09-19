import { Injectable } from '@angular/core';

export interface Section {
  id: number;
  name: string;
  imagePath?: string;
  orderIndex?: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class SectionService {
  private sections: Section[] = [
    {
      id: 1,
      name: 'Geography',
      imagePath: '',
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Politics',
      imagePath: '',
      status: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  getSections(): Section[] {
    return this.sections;
  }

  getSectionById(id: number): Section | undefined {
    return this.sections.find(s => s.id === id);
  }

  addSection(data: Partial<Section>) {
    const newSection: Section = {
      id: Date.now(),
      name: data.name ?? '',
      imagePath: data.imagePath ?? '',
      status: data.status ?? 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sections.push(newSection);
  }

  updateSection(id: number, data: Partial<Section>) {
    const section = this.sections.find(s => s.id === id);
    if (section) {
      section.name = data.name ?? section.name;
      section.imagePath = data.imagePath ?? section.imagePath;
      section.status = data.status ?? section.status;
      section.updatedAt = new Date();
    }
  }

  deleteSection(id: number) {
    this.sections = this.sections.filter(s => s.id !== id);
  }
}