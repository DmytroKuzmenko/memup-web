import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-meme-viewer',
  imports: [CommonModule],
  templateUrl: './meme-viewer.component.html',
  styleUrls: ['./meme-viewer.component.css']
})
export class MemeViewerComponent {
  @Input() meme: any;
  @Output() swipeRight = new EventEmitter<void>();
  @Output() swipeLeft = new EventEmitter<void>();

  touchStartX: number = 0;
  touchEndX: number = 0;

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }
  
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }
  
  handleSwipe() {
    const deltaX = this.touchEndX - this.touchStartX;
    const threshold = 50;
  
    // 👈 свайп влево: перейти к переводу
    if (deltaX < -threshold) {
      this.onSwipeLeft();
    }
  
    // 👉 свайп вправо: открыть меню
    if (deltaX > threshold) {
      this.onSwipeRight();
    }
  }

  onSwipeLeft() {
    console.log('Swipe left detected (иконка)');
    this.swipeLeft.emit();
  }

  onSwipeRight() {
    // Пока просто лог
    console.log('Swipe right detected (иконка)');
    this.swipeRight.emit();
  }
}