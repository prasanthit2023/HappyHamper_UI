import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { from, switchMap } from 'rxjs';
import { HydrationService } from '../services/hydration.service';

/**
 * Attaches the JWT access token from localStorage to outgoing requests.
 * Waits for token hydration to complete to prevent race conditions on page load,
 * while bypassing the wait for the profile query itself to avoid deadlocks.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const hydrationService = inject(HydrationService);

  // Skip auth header for public auth routes
  if (
    req.url.includes('/login') ||
    req.url.includes('/register') ||
    req.url.includes('/phone-login') ||
    req.url.includes('/phone-verify') ||
    req.url.includes('/refresh') ||
    req.url.includes('/verify-otp') ||
    req.url.includes('/resend-otp') ||
    req.url.includes('/forgot-password') ||
    req.url.includes('/reset-password') ||
    req.url.includes('/google')
  ) {
    return next(req);
  }

  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Bypass waiting if this is the profile fetch request during the hydration lifecycle
  const isHydrationMeRequest = req.url.includes('/me') && hydrationService.isHydrating();
  console.log(`[AuthInterceptor] Request for: ${req.url}. isHydrationMeRequest: ${isHydrationMeRequest}. isHydrating: ${hydrationService.isHydrating()}`);

  if (isHydrationMeRequest) {
    const token = localStorage.getItem('bb_access_token');
    console.log('[AuthInterceptor] isHydrationMeRequest matching. Token found in localStorage:', !!token);
    if (token) {
      const cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(cloned);
    }
    return next(req);
  }

  // Otherwise, block outgoing calls until the hydration flow completes (refreshes or clears tokens)
  console.log(`[AuthInterceptor] Request blocked waiting for hydration Complete: ${req.url}`);
  return from(hydrationService.hydrationComplete).pipe(
    switchMap((isLoggedIn) => {
      console.log(`[AuthInterceptor] Hydration complete resolved (isLoggedIn: ${isLoggedIn}). Releasing blocked request: ${req.url}`);
      const token = localStorage.getItem('bb_access_token');
      if (token) {
        console.log(`[AuthInterceptor] Appending access token to: ${req.url}`);
        const cloned = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
        return next(cloned);
      }
      console.log(`[AuthInterceptor] Sending request without token: ${req.url}`);
      return next(req);
    })
  );
};
