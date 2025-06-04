import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; // Вот это важно!

@Component({
  selector: 'app-level-intro',
  templateUrl: './level-intro.component.html',
  styleUrls: ['./level-intro.component.scss'],
  imports: [CommonModule] 
})
export class LevelIntroComponent {
  @Input() phrase = 'Bitte warten...'; // или передавай свою фразу
  @Output() introDone = new EventEmitter<void>();

  state: 'move-in' | 'center' | 'move-out' | 'hidden' = 'move-in';

  // Когда поезд остановился (анимация въезда закончилась)
  onArrived() {
    this.state = 'center';
  }

  // Кнопка "Розпочати"
  startLevel() {
    this.state = 'move-out';
  }

  // Когда поезд уехал полностью
  onDeparted() {
    this.state = 'hidden';
    this.introDone.emit();
  }
}