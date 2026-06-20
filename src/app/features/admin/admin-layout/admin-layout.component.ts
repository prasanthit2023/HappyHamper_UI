import { Component, signal, HostListener, inject, OnInit } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthStore } from '../../../state/auth.store';

@Component({
  selector: 'bb-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen overflow-hidden" style="background: var(--color-bg);">

      <!-- Sidebar Overlay (mobile) -->
      @if (sidebarOpen() && isMobile()) {
        <div class="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm animate-fade-in"
             (click)="sidebarOpen.set(false)"></div>
      }

      <!-- Sidebar -->
      <aside
        class="flex-shrink-0 flex flex-col overflow-y-auto z-40 transition-all duration-300 ease-out"
        [style.width]="(sidebarOpen() || !isMobile()) ? (collapsed() ? '72px' : '260px') : '0px'"
        style="background: white; border-right: 1px solid var(--color-border); box-shadow: 2px 0 20px rgba(0,0,0,0.04);"
        [class.fixed]="isMobile()"
        [class.h-full]="isMobile()"
      >

        <!-- Logo -->
        <div class="px-4 py-5 flex items-center gap-3 flex-shrink-0" style="border-bottom: 1px solid var(--color-border);">
          <a routerLink="/" class="flex items-center gap-2.5 min-w-0" aria-label="Happy Hamper Home">
            <div class="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
              <img src="/logo.jpg" alt="Happy Hamper Logo" class="w-full h-full object-cover" />
            </div>
            @if (!collapsed()) {
              <div class="min-w-0 sidebar-label">
                <div class="font-display font-bold text-base leading-tight" style="color: #2D2D2D;">Happy Hamper</div>
                <div class="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 inline-block"
                     style="background: var(--color-primary-light); color: var(--color-primary-dark);">Admin</div>
              </div>
            }
          </a>
        </div>

        <!-- Collapse toggle (desktop only) -->
        <button
          (click)="toggleCollapsed()"
          class="hidden lg:flex items-center justify-center w-6 h-6 rounded-full absolute -right-3 top-16 z-10 transition-all duration-200 shadow-sm"
          style="background: white; border: 1px solid var(--color-border); color: var(--color-primary);"
          [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <svg class="w-3 h-3 transition-transform" [class.rotate-180]="collapsed()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>

        <!-- Nav -->
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="sidebar-item-active"
              [routerLinkActiveOptions]="{exact: item.exact}"
              class="sidebar-item relative group"
              [class.justify-center]="collapsed()"
              [attr.aria-label]="item.label"
              [attr.title]="collapsed() ? item.label : null"
            >
              <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" [attr.d]="item.svgPath"/>
                </svg>
              </span>
              @if (!collapsed()) {
                <span class="sidebar-label flex-1 text-sm">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                        style="background: var(--color-orange);">{{ item.badge }}</span>
                }
              }
              <!-- Tooltip when collapsed -->
              @if (collapsed()) {
                <div class="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg"
                     style="background: #2D2D2D; color: white;">
                  {{ item.label }}
                  @if (item.badge) {
                    <span class="ml-1 px-1 py-0.5 rounded text-white text-[10px] font-bold"
                          style="background: var(--color-orange);">{{ item.badge }}</span>
                  }
                </div>
              }
            </a>
          }
        </nav>

        <!-- Sidebar Footer -->
        <div class="px-3 py-3 flex-shrink-0 space-y-0.5" style="border-top: 1px solid var(--color-border);">
          <a routerLink="/"
             class="sidebar-item"
             [class.justify-center]="collapsed()"
             [attr.title]="collapsed() ? 'Back to Shop' : null">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            @if (!collapsed()) {
              <span class="sidebar-label text-sm">Back to Shop</span>
            }
          </a>
          <button
            (click)="logout()"
            class="sidebar-item w-full text-left"
            [class.justify-center]="collapsed()"
            [attr.title]="collapsed() ? 'Sign Out' : null"
            style="color: #EF4444;"
          >
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            @if (!collapsed()) {
              <span class="sidebar-label text-sm" style="color: #EF4444;">Sign Out</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main content wrapper -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">

        <!-- Top Header Bar -->
        <header class="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white"
                style="border-bottom: 1px solid var(--color-border); box-shadow: 0 1px 8px rgba(0,0,0,0.04);">

          <!-- Left: Mobile hamburger + Breadcrumb -->
          <div class="flex items-center gap-3 min-w-0">
            <button
              class="lg:hidden btn-icon flex-shrink-0"
              (click)="toggleSidebar()"
              aria-label="Toggle sidebar"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <!-- Dynamic Breadcrumb -->
            <nav class="breadcrumb hidden sm:flex items-center" aria-label="Breadcrumb">
              <a routerLink="/admin/dashboard" class="hover:text-primary-600 transition-colors flex-shrink-0">Admin</a>
              @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
                <svg class="w-3.5 h-3.5 mx-1.5 flex-shrink-0" style="color: var(--color-border);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                </svg>
                @if (last) {
                  <span style="color: var(--color-primary); font-weight: 600;" class="text-sm">{{ crumb.label }}</span>
                } @else {
                  <a [routerLink]="crumb.path" class="hover:text-primary-600 transition-colors text-sm">{{ crumb.label }}</a>
                }
              }
            </nav>

            <!-- Mobile: show current page title -->
            <span class="sm:hidden font-semibold text-sm truncate" style="color: var(--color-text);">
              {{ breadcrumbs().length > 0 ? breadcrumbs()[breadcrumbs().length - 1].label : 'Dashboard' }}
            </span>
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <!-- Notification bell -->

            <!-- Admin avatar + name -->
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0"
                   style="background: var(--gradient-primary);">A</div>
              <div class="hidden sm:block">
                <div class="text-xs font-semibold leading-tight" style="color: #2D2D2D;">Admin</div>
                <div class="text-[10px]" style="color: #9CA3AF;">Administrator</div>
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-auto px-4 sm:px-6 py-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  private router = inject(Router);
  private authStore = inject(AuthStore);

  readonly collapsed = signal(false);
  readonly sidebarOpen = signal(false);
  readonly isMobileSignal = signal(typeof window !== 'undefined' && window.innerWidth < 1024);

  readonly breadcrumbs = signal<{ label: string; path: string }[]>([]);

  private readonly routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    new: 'Add Product',
    edit: 'Edit Product',
    categories: 'Categories',
    inventory: 'Inventory',
    customers: 'Customers',
    coupons: 'Coupons',
    banners: 'Banners',
    returns: 'Returns',
  };

  ngOnInit() {
    this.updateBreadcrumbs(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.updateBreadcrumbs(e.urlAfterRedirects || e.url);
      if (this.isMobile()) this.sidebarOpen.set(false);
    });
  }

  private updateBreadcrumbs(url: string) {
    const segments = url.split('/').filter(s => s && s !== 'admin');
    const crumbs = segments.map((seg, i) => {
      const path = '/admin/' + segments.slice(0, i + 1).join('/');
      const label = this.routeLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
      return { label, path };
    });
    this.breadcrumbs.set(crumbs);
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobileSignal.set(window.innerWidth < 1024);
    if (!this.isMobile()) this.sidebarOpen.set(false);
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  }

  toggleCollapsed() { this.collapsed.update(v => !v); }
  toggleSidebar() { this.sidebarOpen.update(v => !v); }

  logout() {
    this.authStore.logout();
    this.router.navigate(['/auth/login']);
  }

  navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', badge: null, exact: true, svgPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/admin/orders', label: 'Orders', badge: null, exact: false, svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { path: '/admin/products', label: 'Products', badge: null, exact: false, svgPath: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
    { path: '/admin/categories', label: 'Categories', badge: null, exact: false, svgPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { path: '/admin/inventory', label: 'Inventory', badge: null, exact: false, svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { path: '/admin/customers', label: 'Customers', badge: null, exact: false, svgPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/admin/coupons', label: 'Coupons', badge: null, exact: false, svgPath: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { path: '/admin/banners', label: 'Banners', badge: null, exact: false, svgPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/admin/returns', label: 'Returns', badge: null, exact: false, svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  ];
}
