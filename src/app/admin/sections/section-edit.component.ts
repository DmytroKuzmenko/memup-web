import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SectionService, Section } from '../../section.service';
import { LevelService, Level } from '../../level.service';

@Component({
  selector: 'app-section-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './section-edit.component.html',
})
export class SectionEditComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sectionService = inject(SectionService);
  private levelService = inject(LevelService);

  id: number | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    imagePath: [''],
    status: [0, Validators.required], // 0 = Draft, 1 = Published
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
          status: s.status ?? 0,
        });
      }
      this.loadLevels();
    }
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    const dto: Partial<Section> = {
      name: v.name!,
      imagePath: v.imagePath || '',
      status: Number(v.status),
    };

    if (this.isEdit) {
      this.sectionService.updateSection(this.id!, dto);
    } else {
      this.sectionService.addSection(dto);
    }
    this.router.navigate(['/admin/sections']);
  }

  cancel() {
    this.router.navigate(['/admin/sections']);
  }

  private loadLevels() {
    if (!this.id) return;
    this.levels = this.levelService.getLevels(this.id);
  }

  // переходы на страницы уровней
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
}
