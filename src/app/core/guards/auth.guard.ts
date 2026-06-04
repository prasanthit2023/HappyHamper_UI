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
    return true;
  }

  // Always wait for hydration to complete before making a decision.
  // This prevents the "flash of logged-out" state on page refresh.
  const isLoggedIn = await authStore.hydrationComplete;

  if (isLoggedIn || authStore.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
