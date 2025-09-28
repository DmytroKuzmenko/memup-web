import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('=== ADMIN GUARD CHECK ===');
  console.log('Has valid token:', authService.hasValidToken());
  console.log('Is admin:', authService.isAdmin());

  if (authService.hasValidToken() && authService.isAdmin()) {
    console.log('Access granted');
    return true;
  }

  console.log('Access denied, redirecting to login');
  router.navigate(['/admin/login']);
  return false;
};
