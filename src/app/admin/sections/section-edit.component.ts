import { Component } from '@angular/core';
import { SectionService, Section } from '../../section.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-section-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './section-edit.component.html'
})
export class SectionEditComponent {
  sectionForm: ReturnType<FormBuilder['group']>;

  sectionId: number | null = null;
  isEditMode = false;

  constructor(
    private sectionService: SectionService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.sectionForm = this.fb.group({
      name: [''],
      imagePath: [''],
      status: [0]
    });
    // Определить edit или new
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.sectionId = +id;
        const section = this.sectionService.getSectionById(this.sectionId);
        if (section) {
          this.sectionForm.patchValue(section);
        }
      }
    });
  }

  onSubmit() {
  const formValue = this.sectionForm.value;
  if (this.isEditMode && this.sectionId != null) {
    this.sectionService.updateSection(this.sectionId, {
      name: formValue.name ?? '',
      imagePath: formValue.imagePath ?? '',
      status: formValue.status ?? 0
    });
  } else {
    this.sectionService.addSection({
      name: formValue.name ?? '',
      imagePath: formValue.imagePath ?? '',
      status: formValue.status ?? 0
    });
  }
  this.router.navigate(['/admin/sections']);
}
}