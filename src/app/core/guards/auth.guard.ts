import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '../../state/auth.store';

export const authGuard: CanActivateFn = async (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const authStore = inject(AuthStore);
  const router    = inject(Router);

  // On SSR, always allow to prevent premature redirect
  if (!isPlatformBrowser(platformId)) {
    console.log(`[AuthGuard] SSR environment: allowing access to: ${state.url}`);
    return true;
  }

  console.log(`[AuthGuard] Browser environment: guarding route: ${state.url}. Awaiting hydrationComplete...`);
  // Always wait for hydration to complete before making a decision.
  // This prevents the "flash of logged-out" state on page refresh.
  const isLoggedIn = await authStore.hydrationComplete;
  console.log(`[AuthGuard] Hydration completed. Result isLoggedIn: ${isLoggedIn}. authStore.isLoggedIn(): ${authStore.isLoggedIn()}`);

  if (isLoggedIn || authStore.isLoggedIn()) {
    console.log(`[AuthGuard] Allowing access to: ${state.url}`);
    return true;
  }

  console.warn(`[AuthGuard] Access denied to: ${state.url}. Redirecting to /auth/login.`);
  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
