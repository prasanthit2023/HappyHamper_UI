import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '../../state/auth.store';

export const adminGuard: CanActivateFn = async () => {
  const platformId = inject(PLATFORM_ID);
  const authStore = inject(AuthStore);
  const router    = inject(Router);

  if (!isPlatformBrowser(platformId)) {
    return true; // Bypass on SSR server to prevent premature redirect
  }

  // Always wait for hydration to complete before making a decision.
  const isLoggedIn = await authStore.hydrationComplete;

  if ((isLoggedIn || authStore.isLoggedIn()) && authStore.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
