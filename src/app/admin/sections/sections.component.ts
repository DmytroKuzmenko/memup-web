import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionService, Section } from '../../section.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'app-admin-sections',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sections.component.html',
})
export class AdminSectionsComponent {
  sections = signal<Section[]>([]);

  // ВАРИАНТ 1: без FormBuilder, чтобы не «раньше конструктора»
  // search = new FormControl<string>('', { nonNullable: true });

  // ВАРИАНТ 2: с FormBuilder, но инициализируем в конструкторе
  search!: FormControl<string>;

  filtered = computed(() => {
    const q = (this.search?.value ?? '').toLowerCase().trim();
    if (!q) return this.sections();
    return this.sections().filter((s) => s.name.toLowerCase().includes(q));
  });

  constructor(
    private svc: SectionService,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.refresh();
    // Если используешь ВАРИАНТ 2:
    this.search = this.fb.control('', { nonNullable: true });
  }

  refresh() {
    this.sections.set(this.svc.getSections());
  }

  onAdd() {
    this.router.navigate(['/admin/sections/new']);
  }

  onEdit(id: number) {
    this.router.navigate(['/admin/sections', id]);
  }

  onDelete(id: number) {
    if (confirm('Delete this section?')) {
      this.svc.deleteSection(id);
      this.refresh();
    }
  }

  trackById = (_: number, item: Section) => item.id;
}
