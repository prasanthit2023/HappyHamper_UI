import {
  Component, OnInit, signal, computed, inject, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthStore } from '../../../../state/auth.store';

interface Role {
  roleId: number;
  roleName: string;
  isActive: boolean;
  isDeleted: boolean;
}

interface Menu {
  menuId: number;
  menuName: string;
  menuUrl: string;
  moduleName: string;
  isActive: boolean;
}

interface MenuForm {
  menuName: string;
  menuUrl: string;
  moduleName: string;
  isActive: boolean;
}

interface Permission {
  permissionId?: number;
  roleId: number;
  menuId: number;
  menuName?: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
}

interface AdminUser {
  userId: number;
  userName: string;
  email: string;
  mobileNo: string;
  roleId: number | null;
  roleName: string | null;
  isActive: boolean;
  createdOn: string;
}

@Component({
  selector: 'bb-user-access',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 page-enter animate-fade-in max-w-6xl mx-auto px-2">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-beige pb-4 gap-2">
        <div>
          <h1 class="text-2xl font-bold font-display text-neutral-800">User Access Management</h1>
          <p class="text-xs text-neutral-500 mt-1">Manage roles, module permissions, and assign roles to admin staff.</p>
        </div>
        <button
          (click)="toggleGuide()"
          class="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all self-start md:self-auto"
          style="border-color: var(--color-primary); color: var(--color-primary); background: var(--color-primary-light);"
        >
          <i class="pi pi-question-circle"></i> {{ showGuide() ? 'Hide' : 'How to give access?' }}
        </button>
      </div>

      <!-- ══ HOW-TO GUIDE PANEL ══ -->
      @if (showGuide()) {
        <div class="rounded-2xl border-2 p-5 space-y-4 animate-fade-in" style="border-color: var(--color-primary-light); background: linear-gradient(135deg, #f0f1fa 0%, #fff 100%);">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style="background: var(--color-primary);">?</div>
            <h2 class="font-bold text-sm" style="color: var(--color-text);">How to give a user module access — 3 simple steps</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Step 1 -->
            <div class="rounded-xl p-4 space-y-2 bg-white border" style="border-color: var(--color-border);">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-6 h-6 rounded-full text-white text-[11px] font-black flex items-center justify-center flex-shrink-0" style="background: #3b82f6;">1</div>
                <span class="text-xs font-bold text-neutral-700">Create / Select a Role</span>
              </div>
              <p class="text-[11px] text-neutral-500 leading-relaxed">Go to <strong>🔐 Roles &amp; Permissions</strong> tab. Click <strong>+</strong> to create a role (e.g. <em>"Product Manager"</em>), then select it from the list.</p>
              <button (click)="activeTab.set('permissions'); showGuide.set(false)" class="text-[10px] font-bold px-2.5 py-1 rounded-lg" style="background: #eff6ff; color: #3b82f6;">→ Go to Permissions Tab</button>
            </div>
            <!-- Step 2 -->
            <div class="rounded-xl p-4 space-y-2 bg-white border" style="border-color: var(--color-border);">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-6 h-6 rounded-full text-white text-[11px] font-black flex items-center justify-center flex-shrink-0" style="background: #10b981;">2</div>
                <span class="text-xs font-bold text-neutral-700">Tick Module Access</span>
              </div>
              <p class="text-[11px] text-neutral-500 leading-relaxed">In the permission matrix, tick the checkboxes for each module — <strong>View</strong>, <strong>Add</strong>, <strong>Edit</strong>, <strong>Delete</strong>. Click <strong>Save Permissions</strong>.</p>
              <div class="flex gap-1 flex-wrap">
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">✓ View</span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">✓ Add</span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">✓ Edit</span>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">✓ Delete</span>
              </div>
            </div>
            <!-- Step 3 -->
            <div class="rounded-xl p-4 space-y-2 bg-white border" style="border-color: var(--color-border);">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-6 h-6 rounded-full text-white text-[11px] font-black flex items-center justify-center flex-shrink-0" style="background: #f59e0b;">3</div>
                <span class="text-xs font-bold text-neutral-700">Assign Role to User</span>
              </div>
              <p class="text-[11px] text-neutral-500 leading-relaxed">Go to <strong>👥 Admin Users</strong> tab. Find the user, pick the role you just configured from the dropdown, and click <strong>Save</strong>.</p>
              <button (click)="activeTab.set('users'); showGuide.set(false)" class="text-[10px] font-bold px-2.5 py-1 rounded-lg" style="background: #fffbeb; color: #d97706;">→ Go to Admin Users Tab</button>
            </div>
          </div>
          <p class="text-[10px] text-neutral-400 text-center">💡 The user's sidebar will automatically show only the modules they have <strong>View</strong> permission for.</p>
        </div>
      }

      <!-- Responsive Tabs -->
      <div class="flex border-b border-beige overflow-x-auto scrollbar-none">
        @for (tab of tabs; track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            class="py-3 px-6 text-xs font-bold whitespace-nowrap transition-all border-b-2 outline-none"
            [class.border-primary]="activeTab() === tab.id"
            [class.text-primary]="activeTab() === tab.id"
            [class.border-transparent]="activeTab() !== tab.id"
            [class.text-neutral-400]="activeTab() !== tab.id"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- ══════ TAB 1: Roles & Permissions ══════ -->
      @if (activeTab() === 'permissions') {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          <!-- Left: Roles Panel -->
          <div class="card p-4 space-y-4 border border-beige bg-white shadow-sm md:col-span-1">
            <div class="flex justify-between items-center pb-2 border-b border-beige">
              <span class="text-xs font-bold uppercase tracking-wider text-neutral-400">Roles</span>
              <button
                (click)="showNewRoleInput.set(!showNewRoleInput())"
                class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-sm font-bold shadow-pink hover:scale-105 active:scale-95 transition-all"
                style="background: var(--color-primary);"
              >
                +
              </button>
            </div>

            <!-- New role input -->
            @if (showNewRoleInput()) {
              <div class="flex gap-1.5 p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                <input
                  [(ngModel)]="newRoleName"
                  placeholder="Role name..."
                  class="input-field py-1 px-2.5 text-xs flex-1"
                  (keydown.enter)="createRole()"
                />
                <button (click)="createRole()" class="btn-primary py-1 px-3 text-[10px] font-bold">Add</button>
                <button (click)="showNewRoleInput.set(false); newRoleName=''" class="btn-secondary py-1 px-2.5 text-[10px] font-bold text-neutral-500">✕</button>
              </div>
            }

            <!-- Role list -->
            <div class="space-y-1 max-h-[380px] overflow-y-auto pr-1">
              @for (role of roles(); track role.roleId) {
                <div
                  (click)="selectRole(role)"
                  class="p-2.5 rounded-xl cursor-pointer flex justify-between items-center group transition-all duration-200"
                  [class.bg-primary-50]="selectedRole()?.roleId === role.roleId"
                  [class.hover:bg-neutral-50]="selectedRole()?.roleId !== role.roleId"
                >
                  <span class="text-xs font-bold transition-colors"
                        [class.text-primary]="selectedRole()?.roleId === role.roleId"
                        [class.text-neutral-700]="selectedRole()?.roleId !== role.roleId">
                    {{ role.roleName }}
                  </span>
                  
                  @if (role.roleId !== 1) {
                    <button
                      (click)="$event.stopPropagation(); deleteRole(role)"
                      class="w-5 h-5 rounded-md bg-red-50 text-red-600 flex items-center justify-center text-[10px] hover:bg-red-100 transition-all shadow-sm"
                      title="Delete Role"
                    >
                      <i class="pi pi-times"></i>
                    </button>
                  }
                </div>
              }
              @if (roles().length === 0) {
                <div class="py-6 text-center text-neutral-400 text-xs font-semibold">No roles found</div>
              }
            </div>
          </div>

          <!-- Right: Permission Matrix -->
          <div class="card p-5 border border-beige bg-white shadow-sm md:col-span-3 space-y-4">
            @if (!selectedRole()) {
              <div class="py-16 text-center text-neutral-400 space-y-3">
                <div class="text-4xl">🔐</div>
                <div class="text-sm font-bold text-neutral-700">Select a role to configure permissions</div>
                <p class="text-xs text-neutral-400">Choose a role from the left panel or create a new one.</p>
              </div>
            } @else {
              <!-- Matrix Header -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-beige pb-3 gap-3">
                <div>
                  <h3 class="font-bold text-sm text-neutral-800">{{ selectedRole()!.roleName }} Permissions</h3>
                  <p class="text-[11px] text-neutral-400 mt-0.5">Toggle page-level operational access</p>
                </div>
                <button
                  (click)="savePermissions()"
                  [disabled]="saving()"
                  class="btn-primary px-5 py-2 text-xs font-bold shadow-pink flex items-center gap-1.5 self-end sm:self-auto"
                >
                  @if (saving()) {
                    <i class="pi pi-spinner animate-spin text-[10px]"></i>
                  }
                  Save Permissions
                </button>
              </div>

              <!-- Matrix Table (Responsive wrapper) -->
              <div class="overflow-x-auto rounded-xl border border-neutral-100">
                <table class="w-full border-collapse text-left">
                  <thead>
                    <tr class="bg-neutral-50/60 border-b border-neutral-100">
                      <th class="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400 w-2/5">Module / Page</th>
                      <th class="py-2.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">View</th>
                      <th class="py-2.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">Add</th>
                      <th class="py-2.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">Edit</th>
                      <th class="py-2.5 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">Delete</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-100/60">
                    @for (menu of menus(); track menu.menuId) {
                      <tr class="hover:bg-neutral-50/30 transition-colors">
                        <td class="py-3 px-4">
                          <div class="font-bold text-xs text-neutral-700">{{ menu.menuName }}</div>
                          <div class="text-[10px] text-neutral-400 mt-0.5">{{ menu.moduleName }}</div>
                        </td>
                        @for (col of permCols; track col.key) {
                          <td class="py-3 px-3 text-center">
                            <label class="inline-flex items-center justify-center cursor-pointer">
                              <input
                                type="checkbox"
                                [checked]="getPermValue(menu.menuId, col.key)"
                                (change)="togglePerm(menu.menuId, col.key, $event)"
                                class="hidden"
                              />
                              <div
                                class="w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-150"
                                [style.background]="getPermValue(menu.menuId, col.key) ? col.color : 'white'"
                                [style.border-color]="getPermValue(menu.menuId, col.key) ? col.color : 'var(--color-border)'"
                              >
                                @if (getPermValue(menu.menuId, col.key)) {
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                }
                              </div>
                            </label>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              @if (saveSuccess()) {
                <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 animate-fade-in">
                  <i class="pi pi-check-circle"></i> Permissions saved successfully!
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- ══════ TAB 2: Admin Users ══════ -->
      @if (activeTab() === 'users') {
        <div class="card p-5 border border-beige bg-white shadow-sm space-y-4">

          <!-- Quick tip banner -->
          <div class="flex items-start gap-3 rounded-xl px-4 py-3 text-xs" style="background: #fffbeb; border: 1px solid #fde68a;">
            <span class="text-base">💡</span>
            <div class="text-amber-800">
              <strong>How to assign access:</strong> Use the <em>Assign Role</em> dropdown below to pick a role for each user, then click <strong>Save</strong>.
              If no roles exist yet, <button (click)="activeTab.set('permissions')" class="underline font-bold">go to Roles &amp; Permissions tab first</button> to create one.
            </div>
          </div>

          <!-- Add Staff User Section -->
          <div class="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-bold uppercase tracking-wider text-neutral-500">➕ Add New / Promote User to Admin Staff</div>
              <button
                (click)="showAddStaffForm.set(!showAddStaffForm())"
                class="text-xs font-bold px-3 py-1 rounded-xl transition-all"
                [style.background]="showAddStaffForm() ? 'var(--color-border)' : 'var(--color-primary-light)'"
                [style.color]="showAddStaffForm() ? 'var(--color-text-muted)' : 'var(--color-primary)'"
              >
                {{ showAddStaffForm() ? 'Cancel' : 'Search & Add User' }}
              </button>
            </div>

            @if (showAddStaffForm()) {
              <div class="space-y-3 pt-2 border-t border-neutral-200/60 animate-fade-in">
                <div class="flex gap-2">
                  <input
                    [ngModel]="searchQuery()"
                    (ngModelChange)="searchQuery.set($event)"
                    placeholder="Enter phone number or name..."
                    class="input-field text-xs py-1.5 px-3 flex-1"
                    (keydown.enter)="searchUsers()"
                  />
                  <button (click)="searchUsers()" class="btn-primary py-1.5 px-5 text-xs font-bold">
                    @if (searching()) { <i class="pi pi-spinner animate-spin"></i> } @else { Search }
                  </button>
                </div>

                @if (searchError()) {
                  <div class="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">{{ searchError() }}</div>
                }

                @if (searchResults().length > 0) {
                  <div class="border border-neutral-200 rounded-xl bg-white divide-y divide-neutral-100 overflow-hidden">
                    @for (res of searchResults(); track res.id) {
                      <div class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div class="font-bold text-neutral-800">{{ res.firstName }} {{ res.lastName }}</div>
                          <div class="text-[10px] text-neutral-400 font-mono mt-0.5">{{ res.phone }}</div>
                        </div>
                        <div class="flex items-center gap-2">
                          <select
                            [ngModel]="promoteRoleMap()[res.id]"
                            (ngModelChange)="setPromoteRole(res.id, $event)"
                            class="input-field py-1 px-2.5 text-xs min-w-[140px] cursor-pointer"
                          >
                            <option [ngValue]="null">— Select Role —</option>
                            @for (role of roles(); track role.roleId) {
                              <option [ngValue]="role.roleId">{{ role.roleName }}</option>
                            }
                          </select>
                          <button
                            (click)="promoteUser(res.id)"
                            class="btn-primary py-1 px-3 text-[10px] font-bold"
                          >
                            + Add to Staff
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <div class="flex items-center justify-between border-b border-beige pb-3">
            <div>
              <h3 class="font-bold text-sm text-neutral-800">Admin Users</h3>
              <p class="text-[11px] text-neutral-400 mt-0.5">Assign roles to admin staff — each role controls which modules they can access</p>
            </div>
            <span class="text-xs text-neutral-400 font-semibold">{{ adminUsers().length }} Users</span>
          </div>

          @if (loadingUsers()) {
            <div class="py-12 text-center text-xs text-neutral-400 font-semibold flex items-center justify-center gap-2">
              <i class="pi pi-spinner animate-spin"></i> Loading users...
            </div>
          } @else if (adminUsers().length === 0) {
            <div class="py-16 text-center text-neutral-400 space-y-3">
              <div class="text-4xl">👤</div>
              <div class="text-sm font-bold text-neutral-700">No admin users found</div>
            </div>
          } @else {
            <div class="overflow-x-auto rounded-xl border border-neutral-100">
              <table class="w-full border-collapse text-left admin-table">
                <thead>
                  <tr class="bg-neutral-50/60 border-b border-neutral-100">
                    <th class="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400">User Details</th>
                    <th class="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Mobile No</th>
                    <th class="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Current Role</th>
                    <th class="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Assign Role</th>
                    <th class="py-2.5 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">Status</th>
                    <th class="py-2.5 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-100/60">
                  @for (user of adminUsers(); track user.userId) {
                    <tr class="hover:bg-neutral-50/20 transition-colors">
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm select-none">
                            {{ user.userName.charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <div class="font-bold text-xs text-neutral-800">{{ user.userName }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-xs font-semibold text-neutral-600 font-mono">{{ user.mobileNo }}</td>
                      <td class="py-3.5 px-4">
                        @if (user.roleName) {
                          <span class="status-badge status-active px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            {{ user.roleName }}
                          </span>
                        } @else {
                          <span class="text-[10px] text-neutral-400 font-semibold">No Role</span>
                        }
                      </td>
                      <td class="py-3.5 px-4">
                        <select
                          [(ngModel)]="userRoleMap()[user.userId]"
                          (ngModelChange)="setUserRole(user.userId, $event)"
                          class="input-field py-1 px-2.5 text-xs max-w-[150px] cursor-pointer"
                        >
                          <option [ngValue]="null">— No Role —</option>
                          @for (role of roles(); track role.roleId) {
                            <option [ngValue]="role.roleId">{{ role.roleName }}</option>
                          }
                        </select>
                      </td>
                      <td class="py-3.5 px-4 text-center">
                        <span class="status-badge text-[10px]" [class]="user.isActive ? 'status-active' : 'status-cancelled'">
                          {{ user.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-center">
                        <button
                          (click)="saveUserRole(user)"
                          [disabled]="savingUserId() === user.userId"
                          class="btn-primary py-1 px-4 text-[10px] font-bold shadow-pink flex items-center justify-center mx-auto min-w-[64px]"
                        >
                          @if (savingUserId() === user.userId) {
                            <i class="pi pi-spinner animate-spin"></i>
                          } @else {
                            Save
                          }
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

    </div>
  `
})
export class UserAccessComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly authStore = inject(AuthStore);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly api = environment.apiUrl;

  // ── Tabs ────────────────────────────────────────────────────────────────
  readonly tabs = [
    { id: 'permissions', label: '🔐 Roles & Permissions' },
    { id: 'users', label: '👥 Admin Users' },
  ];
  readonly activeTab = signal<string>('permissions');
  readonly showGuide = signal<boolean>(true);

  toggleGuide() { this.showGuide.update(v => !v); }

  // ── Roles ────────────────────────────────────────────────────────────────
  readonly roles = signal<Role[]>([]);
  readonly selectedRole = signal<Role | null>(null);
  readonly showNewRoleInput = signal(false);
  newRoleName = '';

  // ── Menus ────────────────────────────────────────────────────────────────
  readonly menus = signal<Menu[]>([]);

  // ── Menu Management form state ───────────────────────────────────────────
  readonly showAddMenuForm = signal(false);
  readonly editingMenuId = signal<number | null>(null);
  readonly savingMenu = signal(false);
  readonly menuError = signal('');

  newMenu: MenuForm = { menuName: '', menuUrl: '', moduleName: '', isActive: true };
  editMenuData: MenuForm = { menuName: '', menuUrl: '', moduleName: '', isActive: true };

  // ── Permission matrix: { [menuId]: Permission } ─────────────────────────
  readonly permMatrix = signal<Record<number, Permission>>({});
  readonly saving = signal(false);
  readonly saveSuccess = signal(false);

  readonly permCols = [
    { key: 'canView' as const, color: '#3b82f6' },
    { key: 'canAdd' as const, color: '#10b981' },
    { key: 'canEdit' as const, color: '#f59e0b' },
    { key: 'canDelete' as const, color: '#ef4444' },
  ];

  // ── Admin users ──────────────────────────────────────────────────────────
  readonly adminUsers = signal<AdminUser[]>([]);
  readonly loadingUsers = signal(false);
  readonly userRoleMap = signal<Record<number, number | null>>({});
  readonly savingUserId = signal<number | null>(null);

  // ── Add/Promote Staff search state ────────────────────────────────────────
  readonly showAddStaffForm = signal(false);
  readonly searchQuery = signal('');
  readonly searchResults = signal<any[]>([]);
  readonly searching = signal(false);
  readonly searchError = signal('');
  readonly promoteRoleMap = signal<Record<string, number | null>>({});

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  ngOnInit() {
    // Seed default menus (idempotent — safe to call every time)
    this.http.post(`${this.api}/admin/seed-menus`, {}).subscribe({
      next: () => {
        this.loadRoles();
        this.loadMenus();
        this.loadAdminUsers();
      },
      error: () => {
        // Seed may fail if menus already exist or user lacks permission — load anyway
        this.loadRoles();
        this.loadMenus();
        this.loadAdminUsers();
      }
    });
  }

  // ─── Role methods ────────────────────────────────────────────────────────
  loadRoles() {
    this.http.get<any[]>(`${this.api}/RoleMaster`).subscribe({
      next: (res) => this.roles.set(res),
      error: () => { }
    });
  }

  selectRole(role: Role) {
    this.selectedRole.set(role);
    this.saveSuccess.set(false);
    this.loadPermissionsForRole(role.roleId);
  }

  createRole() {
    const name = this.newRoleName.trim();
    if (!name) return;
    this.http.post<any>(`${this.api}/RoleMaster`, {
      roleName: name, isActive: true, isDeleted: false
    }).subscribe({
      next: (role) => {
        this.roles.update(r => [...r, role]);
        this.newRoleName = '';
        this.showNewRoleInput.set(false);
      },
      error: () => { }
    });
  }

  deleteRole(role: Role) {
    if (!confirm(`Delete role "${role.roleName}"?`)) return;
    this.http.delete(`${this.api}/RoleMaster/${role.roleId}`).subscribe({
      next: () => {
        this.roles.update(r => r.filter(x => x.roleId !== role.roleId));
        if (this.selectedRole()?.roleId === role.roleId) this.selectedRole.set(null);
      },
      error: () => { }
    });
  }

  // ─── Permission matrix methods ───────────────────────────────────────────
  loadMenus() {
    this.http.get<any[]>(`${this.api}/MenuMaster`).subscribe({
      next: (res) => this.menus.set(res),
      error: () => { }
    });
  }

  loadPermissionsForRole(roleId: number) {
    this.http.get<any[]>(`${this.api}/RoleMenuPermission/role/${roleId}`).subscribe({
      next: (perms) => {
        const matrix: Record<number, Permission> = {};
        // Seed all menus with false defaults first
        for (const m of this.menus()) {
          matrix[m.menuId] = {
            roleId, menuId: m.menuId,
            canView: false, canAdd: false, canEdit: false, canDelete: false, isActive: true
          };
        }
        // Overwrite with existing permissions
        for (const p of perms) {
          matrix[p.menuId] = {
            permissionId: p.permissionId,
            roleId: p.roleId, menuId: p.menuId,
            canView: p.canView, canAdd: p.canAdd,
            canEdit: p.canEdit, canDelete: p.canDelete,
            isActive: p.isActive
          };
        }
        this.permMatrix.set(matrix);
      },
      error: () => { }
    });
  }

  getPermValue(menuId: number, key: 'canView' | 'canAdd' | 'canEdit' | 'canDelete'): boolean {
    return this.permMatrix()[menuId]?.[key] ?? false;
  }

  togglePerm(menuId: number, key: 'canView' | 'canAdd' | 'canEdit' | 'canDelete', event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.permMatrix.update(m => {
      const updated = { ...m };
      updated[menuId] = { ...updated[menuId], [key]: checked };
      // If unchecking View, also uncheck the others (can't add/edit/delete what you can't see)
      if (key === 'canView' && !checked) {
        updated[menuId] = { ...updated[menuId], canAdd: false, canEdit: false, canDelete: false };
      }
      // If checking Add/Edit/Delete, auto-enable View
      if ((key === 'canAdd' || key === 'canEdit' || key === 'canDelete') && checked) {
        updated[menuId] = { ...updated[menuId], canView: true };
      }
      return updated;
    });
  }

  savePermissions() {
    const role = this.selectedRole();
    if (!role) return;
    this.saving.set(true);
    const payload = Object.values(this.permMatrix()).map(p => ({
      permissionId: p.permissionId ?? 0,
      roleId: role.roleId,
      menuId: p.menuId,
      canView: p.canView, canAdd: p.canAdd,
      canEdit: p.canEdit, canDelete: p.canDelete,
      isActive: true
    }));
    this.http.post(`${this.api}/RoleMenuPermission/save`, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: () => this.saving.set(false)
    });
  }

  // ─── Menu CRUD methods ───────────────────────────────────────────────────
  resetNewMenu() {
    this.newMenu = { menuName: '', menuUrl: '', moduleName: '', isActive: true };
  }

  createMenu() {
    const m = this.newMenu;
    if (!m.menuName.trim() || !m.menuUrl.trim()) {
      this.menuError.set('Menu Name and URL are required.');
      return;
    }
    this.savingMenu.set(true);
    this.menuError.set('');
    this.http.post<any>(`${this.api}/MenuMaster`, {
      menuName: m.menuName.trim(),
      menuUrl: m.menuUrl.trim(),
      moduleName: m.moduleName.trim() || 'General',
      isActive: m.isActive
    }).subscribe({
      next: (created) => {
        this.menus.update(list => [...list, created]);
        this.resetNewMenu();
        this.showAddMenuForm.set(false);
        this.savingMenu.set(false);
      },
      error: (err) => {
        this.menuError.set(err?.error?.message || 'Failed to create menu.');
        this.savingMenu.set(false);
      }
    });
  }

  startEditMenu(menu: Menu) {
    this.editingMenuId.set(menu.menuId);
    this.editMenuData = {
      menuName: menu.menuName,
      menuUrl: menu.menuUrl,
      moduleName: menu.moduleName,
      isActive: menu.isActive
    };
    this.menuError.set('');
  }

  cancelEditMenu() {
    this.editingMenuId.set(null);
    this.menuError.set('');
  }

  saveMenu(menuId: number) {
    const d = this.editMenuData;
    if (!d.menuName.trim() || !d.menuUrl.trim()) {
      this.menuError.set('Menu Name and URL are required.');
      return;
    }
    this.savingMenu.set(true);
    this.menuError.set('');
    this.http.put<any>(`${this.api}/MenuMaster/${menuId}`, {
      menuId,
      menuName: d.menuName.trim(),
      menuUrl: d.menuUrl.trim(),
      moduleName: d.moduleName.trim() || 'General',
      isActive: d.isActive
    }).subscribe({
      next: (updated) => {
        this.menus.update(list => list.map(m => m.menuId === menuId ? { ...m, ...updated } : m));
        this.editingMenuId.set(null);
        this.savingMenu.set(false);
        // Reload permissions matrix if this menu is currently open
        const role = this.selectedRole();
        if (role) this.loadPermissionsForRole(role.roleId);
      },
      error: (err) => {
        this.menuError.set(err?.error?.message || 'Failed to update menu.');
        this.savingMenu.set(false);
      }
    });
  }

  deleteMenu(menu: Menu) {
    if (!confirm(`Delete menu "${menu.menuName}"? This will also remove any associated permissions.`)) return;
    this.http.delete(`${this.api}/MenuMaster/${menu.menuId}`).subscribe({
      next: () => {
        this.menus.update(list => list.filter(m => m.menuId !== menu.menuId));
        // Refresh permissions matrix
        const role = this.selectedRole();
        if (role) this.loadPermissionsForRole(role.roleId);
      },
      error: (err) => {
        this.menuError.set(err?.error?.message || 'Failed to delete menu.');
      }
    });
  }

  // ─── Admin users methods ─────────────────────────────────────────────────
  loadAdminUsers() {
    this.loadingUsers.set(true);
    this.http.get<{ data: AdminUser[] }>(`${this.api}/admin/admin-users`).subscribe({
      next: (res) => {
        this.adminUsers.set(res.data);
        const map: Record<number, number | null> = {};
        for (const u of res.data) { map[u.userId] = u.roleId; }
        this.userRoleMap.set(map);
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false)
    });
  }

  setUserRole(userId: number, roleId: number | null) {
    this.userRoleMap.update(m => ({ ...m, [userId]: roleId }));
  }

  saveUserRole(user: AdminUser) {
    const roleId = this.userRoleMap()[user.userId];
    if (roleId == null) return;
    this.savingUserId.set(user.userId);
    this.http.put(`${this.api}/admin/admin-users/${user.userId}/role`, { roleId }).subscribe({
      next: (res: any) => {
        this.adminUsers.update(users =>
          users.map(u => u.userId === user.userId
            ? { ...u, roleId: res.data.roleId, roleName: res.data.roleName }
            : u)
        );
        this.savingUserId.set(null);
      },
      error: () => this.savingUserId.set(null)
    });
  }

  // ─── Add / Promote Staff methods ─────────────────────────────────────────
  searchUsers() {
    const query = this.searchQuery().trim();
    if (!query) {
      this.searchResults.set([]);
      return;
    }
    this.searching.set(true);
    this.searchError.set('');
    this.http.get<{ data: any[] }>(`${this.api}/admin/customers?search=${encodeURIComponent(query)}`).subscribe({
      next: (res) => {
        const existingIds = this.adminUsers().map(u => u.userId);
        const filtered = (res.data ?? []).filter(u => !existingIds.includes(Number(u.id)));
        this.searchResults.set(filtered);
        this.searching.set(false);
        if (filtered.length === 0) {
          this.searchError.set('No eligible customer users found matching that query.');
        }
      },
      error: () => {
        this.searching.set(false);
        this.searchError.set('Failed to search users.');
      }
    });
  }

  setPromoteRole(userId: string, roleId: number | null) {
    this.promoteRoleMap.update(m => ({ ...m, [userId]: roleId }));
  }

  promoteUser(userIdStr: string) {
    const roleId = this.promoteRoleMap()[userIdStr];
    if (roleId == null) {
      alert('Please select a role to assign first.');
      return;
    }
    const userId = Number(userIdStr);
    this.http.put(`${this.api}/admin/admin-users/${userId}/role`, { roleId }).subscribe({
      next: () => {
        this.loadAdminUsers();
        // Clear search list and close
        this.searchQuery.set('');
        this.searchResults.set([]);
        this.showAddStaffForm.set(false);
        alert('User successfully promoted to Admin Staff!');
      },
      error: () => {
        alert('Failed to promote user to Admin Staff.');
      }
    });
  }
}
