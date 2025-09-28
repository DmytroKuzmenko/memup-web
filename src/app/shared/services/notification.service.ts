import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  showSessionExpired(): void {
    // Простое уведомление через alert
    // В будущем можно заменить на toast уведомления
    alert('Сессия истекла. Пожалуйста, войдите заново.');
  }

  showError(message: string): void {
    alert(`Ошибка: ${message}`);
  }

  showSuccess(message: string): void {
    alert(`Успешно: ${message}`);
  }
}
