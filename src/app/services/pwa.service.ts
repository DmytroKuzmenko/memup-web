import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PwaService {
  deferredPrompt: any;

  constructor() {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event;
    });
  }

  getPromptEvent() {
    return this.deferredPrompt;
  }

  async promptInstall(): Promise<boolean> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const result = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return result.outcome === 'accepted';
    }
    return false;
  }
}
