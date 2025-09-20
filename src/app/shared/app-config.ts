import { InjectionToken } from '@angular/core';

export interface AppConfig {
  /** e.g. 'http://localhost:5000' ; default '' => same-origin */
  apiBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  factory: () => ({ apiBaseUrl: '' }),
});
