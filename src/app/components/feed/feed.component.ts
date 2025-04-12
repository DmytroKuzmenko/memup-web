import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemeViewerComponent } from '../meme-viewer/meme-viewer.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, MemeViewerComponent],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent  implements OnInit {
  memes = [
    { imageUrl: 'https://i.redd.it/uiik2lkr0rse1.jpeg' },
    { imageUrl: 'https://i.redd.it/ondp80gx6kte1.jpeg' },
    { imageUrl: 'https://i.redd.it/98pe0iei12ue1.jpeg' }
  ];

touchStartY: number = 0;
touchEndY: number = 0;
lastScrollTime = 0;

constructor(private router: Router) {}

ngOnInit(): void {
  window.addEventListener('wheel', this.onWheel.bind(this));
  window.addEventListener('keydown', this.onKeyDown.bind(this));
}

ngOnDestroy(): void {
  window.removeEventListener('wheel', this.onWheel.bind(this));
  window.removeEventListener('keydown', this.onKeyDown.bind(this));
}

onWheel(event: WheelEvent) {
  const now = Date.now();
  if (now - this.lastScrollTime < 500) return; // анти-спам
  this.lastScrollTime = now;

  if (event.deltaY > 0) {
    this.next(); // прокрутка вниз
  } else if (event.deltaY < 0) {
    this.prev(); // прокрутка вверх
  }
}

onKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    this.next();
  } else if (event.key === 'ArrowUp') {
    this.prev();
  }
}

onTouchStart(event: TouchEvent) {
  this.touchStartY = event.changedTouches[0].screenY;
}

onTouchEnd(event: TouchEvent) {
  this.touchEndY = event.changedTouches[0].screenY;
  this.handleSwipe();
}

handleSwipe() {
  const delta = this.touchStartY - this.touchEndY;
  const threshold = 50;

  if (delta > threshold) {
    this.next(); // свайп вверх
  } else if (delta < -threshold) {
    this.prev(); // свайп вниз
  }
}

  activeIndex = 0;

  goToDetail() {
    console.log('➡️ переход на /meme');
    this.router.navigate(['/meme']);
  }

  openMenu() {
    console.log('открытие меню')
  }

  get activeMeme() {
    return this.memes[this.activeIndex];
  }

  next() {
    if (this.activeIndex < this.memes.length - 1) {
      this.activeIndex++;
    }
  }

  prev() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }
}