import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaService } from './services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  canInstall = false;
  showInstallPrompt = true;

  constructor(private pwaService: PwaService) {}

  ngOnInit() {
    window.addEventListener('beforeinstallprompt', (event: any) => {
      event.preventDefault();
      this.canInstall = true;
    });
  }

  async installPWA() {
    const installed = await this.pwaService.promptInstall();
    if (installed) {
      console.log('PWA встановлено!');
    } else {
      console.log('Користувач відхилив встановлення');
    }
    this.canInstall = false;
  }

  closePrompt() {
    this.showInstallPrompt = false;
  }
}