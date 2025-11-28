import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const hasAccess = authService.hasValidToken() && authService.isAdmin();
  console.log('=== ADMIN GUARD CHECK ===');
  console.log('Has valid token:', authService.hasValidToken());
  console.log('Is admin:', authService.isAdmin());

  if (hasAccess) {
    console.log('Access granted');
    return true;
  }

  if (!authService.refreshToken) {
    console.log('No refresh token - redirecting to login');
    router.navigate(['/admin/login']);
    return false;
  }

  console.log('Attempting token refresh for admin guard');
  return authService.refresh().pipe(
    map(() => {
      const accessAfterRefresh = authService.hasValidToken() && authService.isAdmin();
      console.log('Access after refresh:', accessAfterRefresh);
      if (!accessAfterRefresh) {
        router.navigate(['/admin/login']);
      }
      return accessAfterRefresh;
    }),
    catchError((err) => {
      console.log('Refresh failed in admin guard:', err);
      router.navigate(['/admin/login']);
      return of(false);
    }),
  );
};
