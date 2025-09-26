import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallPromptComponent } from './shared/components/pwa-install-prompt.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PwaInstallPromptComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
}