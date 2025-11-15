import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-pwa-install-prompt',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isIosOrMac && !canInstall && showInstallPrompt) {
      <div
        class="animate-fade-in fixed right-2 bottom-2 left-2 z-40 flex flex-col rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-lg sm:right-auto sm:bottom-5 sm:left-1/2 sm:w-[90vw] sm:max-w-sm sm:-translate-x-1/2 sm:transform sm:px-4 sm:py-3"
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)"
      >
        <!-- Текст -->
        <div class="px-1 text-center text-sm text-gray-800 sm:px-2">
          <span class="flex items-center justify-center gap-2 text-sm font-medium">
            📲 <span>Встановіть застосунок</span>
          </span>
          <p class="text-xs text-gray-600">
            Натисніть <strong>"Поділитися"</strong> в браузері, потім
            <strong>"На початковий екран"</strong>
          </p>
        </div>
        <button
          (click)="closePrompt()"
          class="absolute top-2 right-2 text-lg text-gray-400 hover:text-gray-500 sm:text-xl"
          aria-label="Закрити"
        >
          ×
        </button>
      </div>
    }
    @if (canInstall && showInstallPrompt) {
      <div
        class="animate-fade-in fixed right-2 bottom-2 left-2 z-40 flex flex-col rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-lg sm:right-auto sm:bottom-5 sm:left-1/2 sm:w-[90vw] sm:max-w-sm sm:-translate-x-1/2 sm:transform sm:px-4 sm:py-3"
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)"
      >
        <div class="flex w-full items-center justify-between">
          <span class="flex items-center gap-2 text-sm font-medium">
            📲 <span>Встановіть застосунок</span>
          </span>

          <button
            (click)="closePrompt()"
            class="text-lg text-gray-400 hover:text-gray-500 sm:hidden"
            aria-label="Закрити"
          >
            ×
          </button>
        </div>

        <div class="mt-2 flex justify-end gap-2 sm:mt-0 sm:ml-auto">
          <button
            (click)="installPWA()"
            class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white shadow transition hover:bg-blue-700"
          >
            Встановити
          </button>

          <button
            (click)="closePrompt()"
            class="hidden text-lg text-gray-400 hover:text-gray-500 sm:inline sm:text-xl"
            aria-label="Закрити"
          >
            ×
          </button>
        </div>
      </div>
    }
  `,
})
export class PwaInstallPromptComponent implements OnInit {
  canInstall = false;
  showInstallPrompt = true;
  private readonly DISMISS_KEY = 'pwa-install-dismissed';
  private readonly WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private touchStartY = 0;
  private touchStartX = 0;

  constructor(private pwaService: PwaService) {}

  ngOnInit() {
    // Check if the prompt was dismissed recently
    if (this.wasRecentlyDismissed()) {
      this.showInstallPrompt = false;
      return;
    }

    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.canInstall = true;
    });
  }

  async installPWA() {
    const installed = await this.pwaService.promptInstall();
    this.closePrompt();
    if (installed) {
      console.log('PWA встановлено!');
    } else {
      console.log('Користувач відхилив встановлення');
    }

    this.canInstall = false;
  }

  closePrompt() {
    this.showInstallPrompt = false;
    // Save the dismiss time
    this.saveDismissTime();
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartY = event.touches[0].clientY;
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent) {
    const touchEndY = event.changedTouches[0].clientY;
    const touchEndX = event.changedTouches[0].clientX;
    const deltaY = this.touchStartY - touchEndY;
    const deltaX = Math.abs(this.touchStartX - touchEndX);

    // If swipe up is more than 50px and horizontal movement is less than 100px
    if (deltaY > 50 && deltaX < 100) {
      this.closePrompt();
    }
  }

  private wasRecentlyDismissed(): boolean {
    const dismissedTime = localStorage.getItem(this.DISMISS_KEY);
    if (!dismissedTime) {
      return false;
    }

    const dismissedTimestamp = parseInt(dismissedTime, 10);
    const now = Date.now();
    const timeSinceDismiss = now - dismissedTimestamp;

    return timeSinceDismiss < this.WEEK_IN_MS;
  }

  private saveDismissTime(): void {
    localStorage.setItem(this.DISMISS_KEY, Date.now().toString());
  }

  get isIosOrMac(): boolean {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|macintosh/.test(userAgent);
  }
}
