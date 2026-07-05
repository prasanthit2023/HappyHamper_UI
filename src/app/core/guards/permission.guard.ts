import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from '../../state/auth.store';
import { PermissionStore } from '../../state/permission.store';

/**
 * Factory guard — use like: canActivate: [permissionGuard('Products', 'view')]
 *
 * Ensures the current admin user has the required permission for this route.
 * SuperAdmin bypasses all checks.
 * On denial → redirects to /admin/dashboard.
 */
export function permissionGuard(
  menuName: string,
  action: 'view' | 'add' | 'edit' | 'delete' = 'view'
): CanActivateFn {
  return async () => {
    const platformId      = inject(PLATFORM_ID);
    const authStore       = inject(AuthStore);
    const permissionStore = inject(PermissionStore);
    const router          = inject(Router);

    // On SSR — allow through to prevent premature redirect
    if (!isPlatformBrowser(platformId)) return true;

    // Wait for auth hydration first
    await authStore.hydrationComplete;

    if (!authStore.isLoggedIn() || !authStore.isAdmin()) {
      return router.createUrlTree(['/']);
    }

    // SuperAdmin always passes
    if (authStore.isSuperAdmin()) return true;

    // Lazy-load permissions if not yet fetched
    if (!permissionStore.loaded()) {
      await permissionStore.load();
    }

    if (permissionStore.canAccess(menuName, action)) {
      return true;
    }

    // Redirect to dashboard with a denied flag the component can read
    return router.createUrlTree(['/admin/dashboard'], {
      queryParams: { denied: menuName },
    });
  };
}
