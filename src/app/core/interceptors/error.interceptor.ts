import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { throwError, catchError, switchMap } from 'rxjs';
import { AuthStore } from '../../state/auth.store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const authStore = injector.get(AuthStore);
      // Only handle 401 errors for authenticated API calls
      // Do NOT intercept: login, register, OTP, refresh, forgot/reset-password, logout, google auth
      const isPublicAuthRoute =
        req.url.includes('/login') ||
        req.url.includes('/register') ||
        req.url.includes('/phone-login') ||
        req.url.includes('/phone-verify') ||
        req.url.includes('/verify-otp') ||
        req.url.includes('/resend-otp') ||
        req.url.includes('/refresh') ||
        req.url.includes('/forgot-password') ||
        req.url.includes('/reset-password') ||
        req.url.includes('/logout') ||
        req.url.includes('/google');

      // 401 on a protected route — try silent token refresh
      // 401 on a protected route — try silent token refresh (only if not currently hydrating)
      if (error.status === 401 && !isPublicAuthRoute && !authStore.isHydrating()) {
        return authStore.refresh().pipe(
          switchMap(() => {
            // Retry original request with the new token from the store
            const newToken = authStore.token();
            const retried = req.clone({
              setHeaders: newToken ? { Authorization: `Bearer ${newToken}` } : {},
            });
            return next(retried);
          }),
          catchError((refreshErr) => {
            // Refresh failed — log out and redirect to login page
            authStore.logout();
            return throwError(() => refreshErr);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
