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
  search!: FormControl<string>;

  query = signal<string>(''); // текущее значение поиска как сигнал

  filtered = computed(() => {
    const q = this.query(); // читаем из сигнала
    const list = this.sections();
    return q ? list.filter((s) => s.name.toLowerCase().includes(q)) : list;
  });

  constructor(
    private svc: SectionService,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.refresh();
    // Если используешь ВАРИАНТ 2:
    this.search = this.fb.control('', { nonNullable: true });

    // ✅ синхронизируем FormControl → сигнал
    this.search.valueChanges.subscribe((v) => this.query.set((v ?? '').toLowerCase().trim()));
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
