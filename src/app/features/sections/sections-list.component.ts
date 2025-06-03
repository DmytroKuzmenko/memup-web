import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SECTIONS, Section } from '../../mock/sections.mock';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-sections-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatProgressBarModule],
  templateUrl: './sections-list.component.html',
  styleUrls: ['./sections-list.component.scss']
})
export class SectionsListComponent {
  sections: Section[] = SECTIONS;

  openSection(id: number) {
    // Навигация (например, [routerLink] в шаблоне, здесь не требуется)
  }
}