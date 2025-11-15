import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private sw = inject(SwUpdate);

  constructor() {
    if (!this.sw.isEnabled) return;

    // New version is ready -> reload the tab
    this.sw.versionUpdates
      .pipe(filter((e: VersionEvent): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => location.reload());

    // In case of a critical SW error -> also reload
    this.sw.unrecoverable.subscribe(() => location.reload());

    // Optional: periodic check for updates every 6 hours
    setInterval(() => this.sw.checkForUpdate().catch(() => {}), 6 * 60 * 60 * 1000);
  }
}
