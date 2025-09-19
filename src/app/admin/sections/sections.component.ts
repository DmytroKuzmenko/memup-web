import { Component } from '@angular/core';
import { SectionService, Section } from '../../section.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-sections',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sections.component.html'
})
export class AdminSectionsComponent {
  sections: Section[];

  constructor(private sectionService: SectionService, private router: Router) {
    this.sections = this.sectionService.getSections();
  }

  onAdd() {
    this.router.navigate(['/admin/sections/new']);
  }

  onEdit(id: number) {
    this.router.navigate(['/admin/sections', id]);
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this section?')) {
      this.sectionService.deleteSection(id);
      this.sections = this.sectionService.getSections(); // refresh
    }
  }
}