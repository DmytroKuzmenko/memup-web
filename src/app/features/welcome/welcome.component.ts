import { Component, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { LanguageService } from '../../shared/services/language.service';
import { LanguageSelectorComponent } from '../../shared/components/language-selector.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LanguageSelectorComponent, TranslatePipe],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);

  @ViewChild('loginFormContainer', { static: false }) loginFormRef?: ElementRef;
  @ViewChild('signupFormContainer', { static: false }) signupFormRef?: ElementRef;

  showLoginForm = false;
  showSignupForm = false;
  loading = false;
  error = '';

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  signupForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {}

  showLogin() {
    this.showLoginForm = true;
    this.showSignupForm = false;
    this.error = '';

    // Scroll to form after a short delay to allow DOM update
    setTimeout(() => {
      if (this.loginFormRef) {
        this.loginFormRef.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);
  }

  showSignup() {
    this.showSignupForm = true;
    this.showLoginForm = false;
    this.error = '';

    // Scroll to form after a short delay to allow DOM update
    setTimeout(() => {
      if (this.signupFormRef) {
        this.signupFormRef.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);
  }

  hideForms() {
    this.showLoginForm = false;
    this.showSignupForm = false;
    this.error = '';
    this.loginForm.reset();
    this.signupForm.reset();
  }

  onLoginSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/sections']);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.languageService.translate(
          'welcome.forms.login.errors.invalidCredentials',
        );
      },
    });
  }

  onSignupSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.signupForm.getRawValue();
    if (password !== confirmPassword) {
      this.error = this.languageService.translate('welcome.forms.signup.errors.passwordsMismatch');
      return;
    }

    this.loading = true;
    this.error = '';

    // For now, just show a success message since we don't have a signup API
    setTimeout(() => {
      this.loading = false;
      this.error = '';
      alert(this.languageService.translate('welcome.forms.signup.errors.signupComingSoon'));
      this.hideForms();
    }, 1000);
  }
}
