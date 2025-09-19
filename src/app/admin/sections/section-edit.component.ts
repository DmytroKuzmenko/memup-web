import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SectionService, Section } from '../../section.service';

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

  id: number | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    imagePath: [''],
    status: [0, Validators.required], // 0 = Draft, 1 = Published
  });

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
    }
  }

  save() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    const dto: Partial<Section> = {
      ...(this.isEdit ? { id: this.id! } : {}),
      name: v.name!,
      imagePath: v.imagePath || '',
      status: Number(v.status),
    };

    if (this.isEdit) {
      this.sectionService.updateSection(this.id!, dto as Partial<Section>);
    } else {
      this.sectionService.addSection(dto as Partial<Section>);
    }
    this.router.navigate(['/admin/sections']);
  }

  cancel() {
    this.router.navigate(['/admin/sections']);
  }
}
