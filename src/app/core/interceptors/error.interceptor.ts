import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, catchError, switchMap } from 'rxjs';
import { AuthStore } from '../../state/auth.store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 errors for authenticated API calls
      // Do NOT intercept: login, register, OTP, refresh, forgot/reset-password, logout, google auth
      const isPublicAuthRoute =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/verify-otp') ||
        req.url.includes('/auth/resend-otp') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/forgot-password') ||
        req.url.includes('/auth/reset-password') ||
        req.url.includes('/auth/logout') ||
        req.url.includes('/auth/google');

      // 401 on a protected route — try silent token refresh
      if (error.status === 401 && !isPublicAuthRoute) {
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
            // Refresh failed — clear session but do NOT navigate
            // Let the guard/component handle the redirect based on state
            authStore.signOutSilent();
            return throwError(() => refreshErr);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
