import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SectionService, PublicSection } from '../../section.service';
import { LanguageSelectorComponent } from '../../shared/components/language-selector.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-sections-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LanguageSelectorComponent, TranslatePipe],
  templateUrl: './sections-list.component.html',
  styleUrls: ['./sections-list.component.scss'],
})
export class SectionsListComponent implements OnInit {
  sections: PublicSection[] = [];
  loading = true;
  error: string | null = null;

  constructor(private sectionService: SectionService) {}

  ngOnInit(): void {
    this.loadSections();
  }

  loadSections(): void {
    this.loading = true;
    this.error = null;

    this.sectionService.getPublicSections().subscribe({
      next: (sections) => {
        this.sections = sections;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sections:', error);
        this.error = 'sections.error';
        this.loading = false;
      },
    });
  }

  getProgressPercentage(section: PublicSection): number {
    if (section.totalLevelsCount === 0) return 0;
    return (section.completedLevelsCount / section.totalLevelsCount) * 100;
  }
}
