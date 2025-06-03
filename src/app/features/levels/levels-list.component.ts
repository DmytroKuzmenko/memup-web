import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LEVELS, Level } from '../../mock/levels.mock';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-levels-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule],
  templateUrl: './levels-list.component.html',
  styleUrls: ['./levels-list.component.scss']
})
export class LevelsListComponent {
  levels: Level[] = [];

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const sectionId = Number(params.get('id'));
      this.levels = LEVELS
        .filter(l => l.sectionId === sectionId)
        .sort((a, b) => a.displayOrder - b.displayOrder);
    });
  }
}
