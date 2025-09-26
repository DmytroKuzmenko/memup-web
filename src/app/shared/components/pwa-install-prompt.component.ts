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
        class="animate-fade-in fixed bottom-5 left-1/2 z-50 flex w-[90vw] max-w-sm -translate-x-1/2 transform flex-col rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-lg sm:flex-row sm:items-center sm:gap-4"
      >
        <!-- Текст -->
        <div class="px-2 text-center text-sm text-gray-800">
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
          class="hidden text-xl text-gray-400 hover:text-gray-500 sm:inline"
          aria-label="Закрити"
        >
          ×
        </button>
      </div>
    }
    @if (canInstall && showInstallPrompt) {
      <div
        class="animate-fade-in fixed bottom-5 left-1/2 z-50 flex w-[90vw] max-w-sm -translate-x-1/2 transform flex-col rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-lg sm:flex-row sm:items-center sm:gap-4"
      >
        <div class="flex w-full items-center justify-between sm:w-auto">
          <span class="flex items-center gap-2 text-sm font-medium">
            📲 <span>Встановіть застосунок</span>
          </span>

          <button
            (click)="closePrompt()"
            class="text-xl text-gray-400 hover:text-gray-500 sm:hidden"
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
            class="hidden text-xl text-gray-400 hover:text-gray-500 sm:inline"
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
  private readonly WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней в миллисекундах

  constructor(private pwaService: PwaService) {}

  ngOnInit() {
    // Проверяем, не было ли отклонение недавно
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
    // Сохраняем время отклонения
    this.saveDismissTime();
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
