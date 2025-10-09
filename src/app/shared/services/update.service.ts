import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private sw = inject(SwUpdate);

  constructor() {
    if (!this.sw.isEnabled) return;

    // Новая версия готова -> перезагружаем вкладку
    this.sw.versionUpdates
      .pipe(filter((e: VersionEvent): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => location.reload());

    // На случай критической ошибки SW -> тоже перезагружаем
    this.sw.unrecoverable.subscribe(() => location.reload());

    // По желанию: периодическая проверка обновлений раз в 6 часов
    setInterval(() => this.sw.checkForUpdate().catch(() => {}), 6 * 60 * 60 * 1000);
  }
}
