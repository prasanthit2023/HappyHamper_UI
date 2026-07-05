import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { AuthStore } from './auth.store';

export interface MenuPermission {
  permissionId: number;
  roleId: number;
  menuId: number;
  menuName: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class PermissionStore {
  private readonly http       = inject(HttpClient);
  private readonly authStore  = inject(AuthStore);
  private readonly platformId = inject(PLATFORM_ID);

  /** All menu permissions for the currently logged-in role. Empty = not yet loaded. */
  readonly permissions = signal<MenuPermission[]>([]);
  readonly loaded      = signal(false);

  /**
   * SuperAdmin (role = 'superadmin') bypasses all permission checks.
   * We expose this so the sidebar and guards can skip the matrix entirely.
   */
  readonly isSuperAdmin = computed(() => this.authStore.isSuperAdmin());

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Load permissions for the current user's role from the backend. */
  async load(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const user = this.authStore.user();
    if (!user) { this.permissions.set([]); this.loaded.set(true); return; }

    // SuperAdmin sees everything — no need to fetch
    if (this.isSuperAdmin()) { this.permissions.set([]); this.loaded.set(true); return; }

    // Extract roleId — it is now part of the User interface
    const roleId = user.roleId;
    if (!roleId) { this.permissions.set([]); this.loaded.set(true); return; }

    return new Promise((resolve) => {
      this.http
        .get<any>(`${environment.apiUrl}/RoleMenuPermission/role/${roleId}`)
        .subscribe({
          next: (res) => {
            // Handle both: plain array [] and wrapped { data: [] }
            const perms: MenuPermission[] = Array.isArray(res)
              ? res
              : Array.isArray(res?.data)
                ? res.data
                : [];
            this.permissions.set(perms);
            this.loaded.set(true);
            resolve();
          },
          error: () => {
            this.permissions.set([]);
            this.loaded.set(true);
            resolve();
          },
        });
    });
  }

  /** Reset on logout. */
  clear() {
    this.permissions.set([]);
    this.loaded.set(false);
  }

  /**
   * Check whether the current user may perform `action` on `menuName`.
   * SuperAdmin always returns true.
   * @param menuName  Exact name as stored in MenuMaster (e.g. "Products", "Orders")
   * @param action    'view' | 'add' | 'edit' | 'delete'
   */
  canAccess(menuName: string, action: 'view' | 'add' | 'edit' | 'delete'): boolean {
    if (this.isSuperAdmin()) return true;

    const perm = this.permissions().find(
      (p) => p.menuName.toLowerCase() === menuName.toLowerCase() && p.isActive
    );
    if (!perm) return false;

    switch (action) {
      case 'view':   return perm.canView;
      case 'add':    return perm.canAdd;
      case 'edit':   return perm.canEdit;
      case 'delete': return perm.canDelete;
      default:       return false;
    }
  }

  /**
   * Returns the list of menu names the current user is allowed to VIEW.
   * Used by sidebar to filter nav items.
   */
  allowedMenus(): string[] {
    if (this.isSuperAdmin()) return ['*']; // all
    return this.permissions()
      .filter((p) => p.canView && p.isActive)
      .map((p) => p.menuName.toLowerCase());
  }
}
