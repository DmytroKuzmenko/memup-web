import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallPromptComponent } from './shared/components/pwa-install-prompt.component';
import { UpdateService } from './shared/services/update.service'; // ⬅️ добавили

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PwaInstallPromptComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  // Сам факт инъекции запускает логику авто-обновления
  private _ = inject(UpdateService);
}
