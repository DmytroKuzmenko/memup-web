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
    userName: ['', [Validators.required, Validators.minLength(3)]],
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

    const { email, userName, password, confirmPassword } = this.signupForm.getRawValue();
    if (password !== confirmPassword) {
      this.error = this.languageService.translate('welcome.forms.signup.errors.passwordsMismatch');
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register({ email, userName, password }).subscribe({
      next: (response) => {
        this.loading = false;
        this.error = '';
        // Show success message and redirect to login
        alert(this.languageService.translate('welcome.forms.signup.success'));
        this.showLogin();
        // Pre-fill email in login form
        this.loginForm.patchValue({ email });
      },
      error: (err) => {
        this.loading = false;
        console.error('Registration error:', err);

        // Handle different error types
        if (err.status === 409 || (err.error && err.error.message === 'EmailAlreadyInUse')) {
          this.error = this.languageService.translate('welcome.forms.signup.errors.emailExists');
        } else if (err.status === 400) {
          // Check if there are specific validation errors
          if (err.error && err.error.errors && Array.isArray(err.error.errors)) {
            // Translate common password validation errors
            const translatedErrors = err.error.errors.map((error: string) => {
              if (error.includes('lowercase')) {
                return this.languageService.translate(
                  'welcome.forms.signup.errors.passwordLowercase',
                );
              } else if (error.includes('uppercase')) {
                return this.languageService.translate(
                  'welcome.forms.signup.errors.passwordUppercase',
                );
              } else if (error.includes('digit') || error.includes('number')) {
                return this.languageService.translate('welcome.forms.signup.errors.passwordNumber');
              } else if (error.includes('special')) {
                return this.languageService.translate(
                  'welcome.forms.signup.errors.passwordSpecial',
                );
              }
              return error; // Return original error if no translation found
            });
            this.error = translatedErrors.join('\n');
          } else {
            this.error = this.languageService.translate(
              'welcome.forms.signup.errors.validationFailed',
            );
          }
        } else {
          this.error = this.languageService.translate(
            'welcome.forms.signup.errors.registrationFailed',
          );
        }
      },
    });
  }
}
