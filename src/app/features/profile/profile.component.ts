import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressService } from '../../services/progress.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  progress = this.progressService.getProgress();

  constructor(private progressService: ProgressService) {}

  resetProgress() {
    this.progressService.reset();
    this.progress = this.progressService.getProgress();
  }
}
