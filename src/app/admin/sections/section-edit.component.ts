// src/app/admin/sections/section-edit.component.ts
import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, take } from 'rxjs';

import { SectionService, Section } from '../../section.service';
import { LevelService, Level } from '../../level.service';
import { ImagePickerComponent } from '../../shared/components/image-picker.component';

@Component({
  selector: 'app-section-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImagePickerComponent],
  templateUrl: './section-edit.component.html',
})
export class SectionEditComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sectionService = inject(SectionService);
  private levelService = inject(LevelService);

  @ViewChild('sectionImagePicker') sectionImagePicker?: ImagePickerComponent;

  id: string | null = null;

  // Секция теперь как поток (при отсутствии id — undefined)
  section$?: Observable<Section>;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    imagePath: [''],
    orderIndex: [0, [Validators.required, Validators.min(0)]],
    status: [0, Validators.required],
  });

  levels: Level[] = [];

  get isEdit() {
    return this.id !== null;
  }

  onImagePending(b: Blob | null) {
    console.log('pending blob:', b);
  }
  onImageUploaded(url: string) {
    console.log('uploaded url:', url);
  }

  ngOnInit() {
    console.log('=== SECTION EDIT COMPONENT INIT ===');

    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam || null;

    console.log('ID parameter:', idParam);
    console.log('Parsed ID:', this.id);
    console.log('Is edit mode:', this.isEdit);

    if (this.id) {
      console.log('Loading section with ID:', this.id);

      // грузим секцию из API
      this.section$ = this.sectionService.getSectionById(this.id);

      // один раз патчим форму значениями из API
      this.section$.pipe(take(1)).subscribe({
        next: (s) => {
          console.log('✅ Section data received:', s);
          console.log('Patching form with values:', {
            name: s.name ?? '',
            imagePath: s.imagePath ?? '',
            orderIndex: s.orderIndex ?? 0,
            status: s.status ?? 0,
          });

          this.form.patchValue({
            name: s.name ?? '',
            imagePath: s.imagePath ?? '',
            orderIndex: s.orderIndex ?? 0,
            status: s.status ?? 0,
          });

          console.log('Form values after patch:', this.form.value);
        },
        error: (error) => {
          console.error('❌ Error loading section:', error);
        },
      });

      this.loadLevels();
    } else {
      console.log('Creating new section (no ID)');
    }

    console.log('=== END SECTION EDIT INIT ===');
  }

  get levelsSorted(): Level[] {
    return [...this.levels].sort((a, b) => {
      const ao = (a as any).orderIndex ?? Number.MAX_SAFE_INTEGER;
      const bo = (b as any).orderIndex ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
  }

  async save() {
    console.log('=== SECTION SAVE ===');
    console.log('SectionImagePicker:', this.sectionImagePicker);

    const url = await this.sectionImagePicker?.uploadPendingIfAny();
    console.log('Upload URL result:', url);

    if (url) {
      console.log('Updating form with URL:', url);
      this.form.patchValue({ imagePath: url });
    }

    if (this.form.invalid) {
      console.log('Form is invalid');
      return;
    }
    const v = this.form.getRawValue();
    console.log('Form values:', v);

    const dto: Partial<Section> = {
      name: v.name!,
      imagePath: v.imagePath || '',
      orderIndex: Number(v.orderIndex),
      status: Number(v.status),
    };

    if (this.isEdit) {
      this.sectionService
        .updateSection(this.id!, dto)
        .pipe(take(1))
        .subscribe({
          next: () => this.router.navigate(['/admin/sections']),
        });
    } else {
      this.sectionService
        .addSection(dto)
        .pipe(take(1))
        .subscribe({
          next: () => this.router.navigate(['/admin/sections']),
        });
    }
  }

  cancel() {
    this.router.navigate(['/admin/sections']);
  }

  private loadLevels() {
    if (!this.id) return;
    // пока LevelService у тебя синхронный — оставляю так
    // Временно используем числовой ID для мок-сервиса
    const numericId = parseInt(this.id, 10);
    if (!isNaN(numericId)) {
      this.levels = this.levelService.getLevels(numericId);
    }
  }

  openAddLevel() {
    if (!this.id) return;
    this.router.navigate(['/admin/levels/new'], { queryParams: { sectionId: this.id } });
  }

  openEditLevel(lvl: Level) {
    const sectionId = this.id ?? (lvl as any).sectionId;
    this.router.navigate(['/admin/levels', lvl.id], { queryParams: { sectionId } });
  }

  deleteLevel(id: number) {
    if (confirm('Delete this level?')) {
      this.levelService.deleteLevel(id);
      this.loadLevels();
    }
  }

  trackByLevelId = (_: number, x: Level) => x.id;
}
