import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SectionService, Section } from '../../section.service';
import { LevelService, Level } from '../../level.service';

@Component({
  selector: 'app-level-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './level-edit.component.html',
})
export class LevelEditComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sectionsSvc = inject(SectionService);
  private levelsSvc = inject(LevelService);

  id: number | null = null;
  sections: Section[] = [];

  form = this.fb.group({
    sectionId: [null as number | null, Validators.required],
    name: ['', [Validators.required, Validators.minLength(1)]],
    status: [1, Validators.required], // 1 = Published, 0 = Draft
    orderIndex: [null as number | null], // optional
  });

  get isEdit() {
    return this.id !== null;
  }

  ngOnInit() {
    this.sections = this.sectionsSvc.getSections();

    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;

    const qpSectionId = this.route.snapshot.queryParamMap.get('sectionId');
    if (!this.id && qpSectionId) {
      this.form.patchValue({ sectionId: Number(qpSectionId) });
    }

    if (this.id) {
      const lvl = this.levelsSvc.getLevelById(this.id);
      if (lvl) {
        this.form.patchValue({
          sectionId: lvl.sectionId,
          name: lvl.name,
          status: lvl.status,
          orderIndex: lvl.orderIndex ?? null,
        });
      }
    }
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    const dto: Partial<Level> = {
      sectionId: Number(v.sectionId),
      name: v.name!,
      status: Number(v.status),
      orderIndex: v.orderIndex != null ? Number(v.orderIndex) : undefined,
    };

    if (this.isEdit) {
      this.levelsSvc.updateLevel(this.id!, dto);
    } else {
      this.levelsSvc.addLevel(dto);
    }

    // Возврат на страницу редактирования секции
    const sid = dto.sectionId!;
    this.router.navigate(['/admin/sections', sid]);
  }

  cancel() {
    // Пытаемся вернуться к секции из queryParam; если нет — к списку секций
    const sid = this.route.snapshot.queryParamMap.get('sectionId');
    if (sid) this.router.navigate(['/admin/sections', Number(sid)]);
    else this.router.navigate(['/admin/sections']);
  }
}
