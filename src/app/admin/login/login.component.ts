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
    // Check if the user is already authenticated
    if (this.authService.hasValidToken() && this.authService.isAdmin()) {
      this.router.navigate(['/admin/sections']);
    }
  }

  onSubmit(): void {
    console.log('=== onSubmit() CALLED ===');
    console.log('Form valid:', this.loginForm.valid);
    console.log('Form invalid:', this.loginForm.invalid);
    console.log('Form errors:', this.loginForm.errors);
    console.log('Email errors:', this.loginForm.controls.email.errors);
    console.log('Password errors:', this.loginForm.controls.password.errors);

    this.loginError = '';

    if (this.loginForm.invalid) {
      console.log('❌ Form is invalid, marking as touched and returning');
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    console.log('✅ Form is valid, proceeding with login');
    console.log('Form values:', { email, password });
    console.log('Setting loading to true');
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

          // Add a short delay so logs can be displayed
          setTimeout(() => {
            if (isAdmin) {
              console.log('✅ User is admin, navigating to admin sections');
              this.router.navigate(['/admin/sections']);
            } else {
              console.log('❌ User is NOT admin, redirecting to home');
              console.log('Role from token:', userRole);
              this.loginError = `You have successfully logged in, but you do not have administrator rights. Your role: ${userRole || 'not defined'}`;

              // Show the message for 3 seconds, then redirect
              setTimeout(() => {
                this.router.navigate(['/']);
              }, 3000);
            }
          }, 100);

          this.loginError = '';
        },
        error: (e) => {
          console.error('Login error in component:', e);

          // More detailed error handling
          let errorMessage = 'An error occurred while logging in';

          if (e.status === 0) {
            errorMessage =
              'Unable to connect to the server. Make sure the backend is running on port 8080';
          } else if (e.status === 401) {
            errorMessage = 'Invalid email or password';
          } else if (e.status === 404) {
            errorMessage = 'Server not found. Check the configuration';
          } else if (e.status >= 500) {
            errorMessage = 'Server error. Please try again later';
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
