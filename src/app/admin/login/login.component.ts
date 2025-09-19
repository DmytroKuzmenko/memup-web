import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
    })
export class AdminLoginComponent {
  loginForm;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: [''],
      password: ['']
    });
  }

   ngOnInit() {
    this.authService.logout(); // Сбрасывает авторизацию при заходе на /admin/login
  }

  onSubmit() {
  const { email, password } = this.loginForm.value;
  const success = this.authService.login(email!, password!);
  if (success) {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin/sections']);
    } else {
      this.router.navigate(['/']);
    }
    // ВАЖНО: сбрасывай loginError при успешном логине
    this.loginError = '';
  } else {
    this.loginError = 'Wrong email or password';
  }
}
}