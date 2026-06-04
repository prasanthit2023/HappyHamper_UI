import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Attaches the JWT access token from localStorage to outgoing requests.
 * Reads directly from localStorage (not from the AuthStore signal) to avoid
 * circular dependency issues during the AuthStore constructor initialization.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  // Skip auth header for public auth routes
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/verify-otp') ||
    req.url.includes('/auth/resend-otp') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/reset-password') ||
    req.url.includes('/auth/google')
  ) {
    return next(req);
  }

  let token: string | null = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('bb_access_token');
  }

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }

  return next(req);
};
