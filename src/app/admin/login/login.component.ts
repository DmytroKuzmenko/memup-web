import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class AdminLoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  loginError = '';
  loading = false;

  constructor() {
    console.log('AdminLoginComponent constructor called');
  }

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    // Проверяем, не авторизован ли уже пользователь
    if (this.authService.hasValidToken() && this.authService.isAdmin()) {
      this.router.navigate(['/admin/sections']);
    }
  }

  onSubmit(): void {
    console.log('onSubmit called');
    this.loginError = '';
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    console.log('Form values:', { email, password });
    this.loading = true;

    this.authService
      .login({ email, password })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          console.log('=== LOGIN SUCCESSFUL ===');
          console.log('Login successful - next() called');

          const userRole = this.authService.userRole();
          const isAdmin = this.authService.isAdmin();
          const accessToken = this.authService.accessToken;
          const localStorageData = localStorage.getItem('memup_auth');

          console.log('User role:', userRole);
          console.log('Is admin:', isAdmin);
          console.log('Access token:', accessToken);
          console.log('LocalStorage memup_auth:', localStorageData);

          // Добавляем задержку чтобы логи успели отобразиться
          setTimeout(() => {
            if (isAdmin) {
              console.log('✅ User is admin, navigating to admin sections');
              this.router.navigate(['/admin/sections']);
            } else {
              console.log('❌ User is NOT admin, redirecting to home');
              console.log('Role from token:', userRole);
              this.loginError = `Вы успешно вошли, но у вас нет прав администратора. Ваша роль: ${userRole || 'не определена'}`;

              // Показываем сообщение 3 секунды, затем перенаправляем
              setTimeout(() => {
                this.router.navigate(['/']);
              }, 3000);
            }
          }, 100);

          this.loginError = '';
        },
        error: (e) => {
          console.error('Login error in component:', e);

          // Более детальная обработка ошибок
          let errorMessage = 'Произошла ошибка при входе';

          if (e.status === 0) {
            errorMessage =
              'Не удается подключиться к серверу. Проверьте, что бэкенд запущен на порту 8080';
          } else if (e.status === 401) {
            errorMessage = 'Неверный email или пароль';
          } else if (e.status === 404) {
            errorMessage = 'Сервер не найден. Проверьте настройки';
          } else if (e.status >= 500) {
            errorMessage = 'Ошибка сервера. Попробуйте позже';
          } else if (e?.error?.message) {
            errorMessage = e.error.message;
          } else if (e?.error?.detail) {
            errorMessage = e.error.detail;
          }

          this.loginError = errorMessage;
        },
      });
  }
}
