import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  showSessionExpired(): void {
    // Simple notification via alert
    // Can be replaced with toast notifications in the future
    alert('Session expired. Please log in again.');
  }

  showError(message: string): void {
    alert(`Error: ${message}`);
  }

  showSuccess(message: string): void {
    alert(`Success: ${message}`);
  }
}
