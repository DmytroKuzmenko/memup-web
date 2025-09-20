import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SectionService, Section } from '../../section.service';
import { LevelService, Level } from '../../level.service';
import { ImagePickerComponent } from '../../shared/components/image-picker.component';
import { ViewChild } from '@angular/core';

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

  id: number | null = null;

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

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;

    if (this.id) {
      const s = this.sectionService.getSectionById(this.id);
      if (s) {
        this.form.patchValue({
          name: s.name ?? '',
          imagePath: s.imagePath ?? '',
          orderIndex: s.orderIndex ?? 0,
          status: s.status ?? 0,
        });
      }
      this.loadLevels();
    }
  }

  // сортировка уровней на вывод
  get levelsSorted(): Level[] {
    return [...this.levels].sort((a, b) => {
      const ao = a.orderIndex ?? Number.MAX_SAFE_INTEGER;
      const bo = b.orderIndex ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
  }

  async save() {
    // загрузим отложенное изображение, если есть
    const url = await this.sectionImagePicker?.uploadPendingIfAny();
    if (url) this.form.patchValue({ imagePath: url });

    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    const dto: Partial<Section> = {
      name: v.name!,
      imagePath: v.imagePath || '',
      orderIndex: Number(v.orderIndex),
      status: Number(v.status),
    };

    if (this.isEdit) this.sectionService.updateSection(this.id!, dto);
    else this.sectionService.addSection(dto);

    this.router.navigate(['/admin/sections']);
  }

  cancel() {
    this.router.navigate(['/admin/sections']);
  }

  private loadLevels() {
    if (!this.id) return;
    this.levels = this.levelService.getLevels(this.id);
  }

  openAddLevel() {
    if (!this.id) return;
    this.router.navigate(['/admin/levels/new'], { queryParams: { sectionId: this.id } });
  }

  openEditLevel(lvl: Level) {
    const sectionId = this.id ?? lvl.sectionId;
    this.router.navigate(['/admin/levels', lvl.id], { queryParams: { sectionId } });
  }

  deleteLevel(id: number) {
    if (confirm('Delete this level?')) {
      this.levelService.deleteLevel(id);
      this.loadLevels();
    }
  }

  trackByLevelId = (_: number, x: Level) => x.id;

  // для отображения дат в шаблоне — берём из сервиса
  get sectionDates() {
    if (!this.id) return null;
    return this.sectionService.getSectionById(this.id) ?? null;
  }
}
