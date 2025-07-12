import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
 standalone: true,
  selector: 'app-level-intro',
  templateUrl: './level-intro.component.html',
  styleUrls: ['./level-intro.component.scss'],
  imports: [CommonModule]
})
export class LevelIntroComponent {
  @Input() phrase = 'Bitte warten...';
  @Output() introDone = new EventEmitter<void>();

  state: 'idle' | 'move' | 'hidden' = 'idle';
buttonVisible = true;

  startLevel() {
     this.buttonVisible = false; // ⬅️ скрываем кнопку
    this.state = 'move';
  }

  onDeparted() {
    this.state = 'hidden';
    this.introDone.emit();
  }
}