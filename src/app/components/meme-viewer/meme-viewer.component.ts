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
  
  hearts: { x: number; y: number; id: number }[] = [];
  heartId = 0;

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.changedTouches[0].screenX;
  }
  
  onTouchEnd(event: TouchEvent) {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  onDoubleTap(event: MouseEvent | TouchEvent) {
    const { clientX, clientY } = this.getCoords(event);
  
    this.hearts.push({ x: clientX, y: clientY, id: this.heartId++ });
  
    this.like(); // вызываем лайк
  
    // Удаляем через 1 секунду
    setTimeout(() => {
      this.hearts = this.hearts.filter(h => h.id !== this.heartId - 1);
    }, 1000);
  }

  getCoords(event: MouseEvent | TouchEvent) {
    if (event instanceof MouseEvent) {
      return { clientX: event.clientX, clientY: event.clientY };
    } else {
      const touch = event.touches[0] || event.changedTouches[0];
      return { clientX: touch.clientX, clientY: touch.clientY };
    }
  }
  
  like() {
    console.log('Лайк!'); // Здесь можно вызывать API или emit
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