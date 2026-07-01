import { Component, signal, HostListener, inject, OnInit, computed } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthStore } from '../../../state/auth.store';

@Component({
  selector: 'bb-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styles: [`
    .sidebar-transition {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .label-fade {
      transition: opacity 0.15s ease, width 0.25s ease, margin 0.25s ease;
      overflow: hidden;
      white-space: nowrap;
    }
  `],
  template: `
    <div class="flex h-screen overflow-hidden" style="background: var(--color-bg);">

      <!-- Mobile Backdrop -->
      @if (mobileOpen()) {
        <div
          class="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm animate-fade-in"
          (click)="closeMobile()"
          aria-hidden="true">
        </div>
      }

      <!-- ══════════════════ SIDEBAR ══════════════════ -->
      <aside
        class="sidebar-transition flex-shrink-0 flex flex-col z-40"
        [style]="sidebarStyle()"
        style="background: white; border-right: 1px solid var(--color-border); box-shadow: 2px 0 24px rgba(0,0,0,0.06);"
      >

        <!-- Logo row -->
        <div class="px-4 flex items-center gap-2 flex-shrink-0"
             style="border-bottom: 1px solid var(--color-border); min-height: 64px;">
          <a routerLink="/" class="flex items-center gap-2.5 min-w-0 flex-1" aria-label="Home">
            <div class="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
              <img src="/logo.jpg" alt="H" class="w-full h-full object-cover" />
            </div>
            <div class="label-fade min-w-0"
                 [style.opacity]="collapsed() ? '0' : '1'"
                 [style.width]="collapsed() ? '0px' : '150px'">
              <div class="font-display font-bold text-sm leading-tight truncate" style="color: #2D2D2D;">Happy Hamper</div>
              <div class="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded mt-0.5 inline-block"
                   style="background: var(--color-primary-light); color: var(--color-primary-dark);">Admin</div>
            </div>
          </a>

          <!-- ✕ close button — mobile only -->
          <button
            class="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
            style="color: var(--color-text-muted);"
            (click)="closeMobile()"
            aria-label="Close menu">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>



        <!-- Nav links -->
        <nav class="flex-1 px-2.5 py-4 space-y-0.5" aria-label="Admin navigation">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="sidebar-item-active"
              [routerLinkActiveOptions]="{exact: item.exact}"
              (click)="onNavClick()"
              class="sidebar-item relative group"
              [class.justify-center]="collapsed()"
              [attr.title]="collapsed() ? item.label : null"
              [attr.aria-label]="item.label"
            >
              <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" [attr.d]="item.svgPath"/>
                </svg>
              </span>
              <span class="label-fade text-sm"
                    [style.opacity]="collapsed() ? '0' : '1'"
                    [style.width]="collapsed() ? '0px' : '160px'"
                    [style.marginLeft]="collapsed() ? '0' : '10px'">
                {{ item.label }}
              </span>
              @if (item.badge && !collapsed()) {
                <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white flex-shrink-0"
                      style="background: var(--color-orange);">{{ item.badge }}</span>
              }
              <!-- Tooltip when collapsed -->
              @if (collapsed()) {
                <div class="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                            opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg"
                     style="background: #1F2937; color: white;">
                  {{ item.label }}
                </div>
              }
            </a>
          }
        </nav>

        <!-- Footer -->
        <div class="px-2.5 py-3 flex-shrink-0 space-y-0.5" style="border-top: 1px solid var(--color-border);">
          <a routerLink="/" (click)="onNavClick()"
             class="sidebar-item"
             [class.justify-center]="collapsed()"
             [attr.title]="collapsed() ? 'Back to Shop' : null">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span class="label-fade text-sm"
                  [style.opacity]="collapsed() ? '0' : '1'"
                  [style.width]="collapsed() ? '0px' : '160px'"
                  [style.marginLeft]="collapsed() ? '0' : '10px'">Back to Shop</span>
          </a>

          <button (click)="logout()"
                  class="sidebar-item w-full text-left"
                  [class.justify-center]="collapsed()"
                  [attr.title]="collapsed() ? 'Sign Out' : null"
                  style="color: #EF4444;">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="label-fade text-sm"
                  [style.opacity]="collapsed() ? '0' : '1'"
                  [style.width]="collapsed() ? '0px' : '160px'"
                  [style.marginLeft]="collapsed() ? '0' : '10px'"
                  style="color: #EF4444;">Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- ══════════════════ MAIN AREA ══════════════════ -->
      <div class="flex-1 flex flex-col overflow-hidden min-w-0">

        <!-- Top Header -->
        <header class="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 bg-white gap-3"
                style="border-bottom: 1px solid var(--color-border); box-shadow: 0 1px 8px rgba(0,0,0,0.04); min-height: 64px;">

          <div class="flex items-center gap-3 min-w-0 flex-1">

            <!-- Mobile hamburger -->
            <button
              class="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border transition-colors"
              style="border-color: var(--color-border);"
              (click)="openMobile()"
              aria-label="Open menu">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                   style="color: var(--color-text);">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
            </button>

            <!-- Desktop sidebar toggle -->
            <button
              class="hidden lg:flex flex-shrink-0 w-9 h-9 items-center justify-center rounded-lg border transition-colors"
              style="border-color: var(--color-border);"
              (click)="toggleCollapsed()"
              [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                   style="color: var(--color-text-muted);">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <!-- Breadcrumb -->
            <nav class="breadcrumb hidden sm:flex items-center gap-1 min-w-0" aria-label="Breadcrumb">
              <a routerLink="/admin/dashboard"
                 class="flex-shrink-0 text-sm transition-colors hover:opacity-80"
                 style="color: var(--color-text-muted);">Admin</a>
              @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
                <svg class="w-3.5 h-3.5 flex-shrink-0" style="color: var(--color-border);"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                </svg>
                @if (last) {
                  <span class="text-sm font-semibold truncate max-w-[140px]"
                        style="color: var(--color-primary);" [title]="crumb.label">{{ crumb.label }}</span>
                } @else {
                  <a [routerLink]="crumb.path"
                     class="flex-shrink-0 text-sm transition-colors hover:opacity-80"
                     style="color: var(--color-text-muted);">{{ crumb.label }}</a>
                }
              }
            </nav>

            <!-- Mobile: current page title -->
            <span class="sm:hidden font-semibold text-sm truncate" style="color: var(--color-text);">
              {{ currentPageTitle() }}
            </span>
          </div>

          <!-- Admin avatar -->
          <div class="flex items-center gap-2.5 flex-shrink-0">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                 style="background: var(--gradient-primary);">A</div>
            <div class="hidden sm:block leading-tight">
              <div class="text-xs font-semibold" style="color: #2D2D2D;">Admin</div>
              <div class="text-[10px]" style="color: #9CA3AF;">Administrator</div>
            </div>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-auto px-4 sm:px-6 py-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent implements OnInit {
  private router    = inject(Router);
  readonly authStore = inject(AuthStore);

  readonly collapsed   = signal(false);
  readonly mobileOpen  = signal(false);
  readonly windowWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1280);

  readonly isMobile = computed(() => this.windowWidth() < 1024);

  /** Sidebar inline style — computed so template stays clean */
  readonly sidebarStyle = computed(() => {
    if (this.isMobile()) {
      return [
        'position:fixed',
        'top:0', 'left:0', 'bottom:0',
        'width:260px',
        'height:100%',
        'overflow-y:auto',
        'overflow-x:hidden',
        `transform:translateX(${this.mobileOpen() ? '0' : '-100%'})`,
      ].join(';');
    }
    return [
      'position:relative',
      `width:${this.collapsed() ? '72px' : '260px'}`,
      'height:100%',
      'overflow-y:auto',
      'overflow-x:hidden',
    ].join(';');
  });

  readonly breadcrumbs = signal<{ label: string; path: string }[]>([]);

  readonly currentPageTitle = computed(() => {
    const crumbs = this.breadcrumbs();
    return crumbs.length > 0 ? crumbs[crumbs.length - 1].label : 'Dashboard';
  });

  private readonly routeLabels: Record<string, string> = {
    dashboard:  'Dashboard',
    orders:     'Orders',
    products:   'Products',
    new:        'Add Product',
    edit:       'Edit Product',
    categories: 'Categories',
    inventory:  'Inventory',
    customers:  'Customers',
    coupons:    'Coupons',
    banners:    'Banners',
    returns:    'Returns',
  };

  ngOnInit() {
    this.updateBreadcrumbs(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.updateBreadcrumbs(e.urlAfterRedirects || e.url);
      if (this.isMobile()) this.mobileOpen.set(false);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.windowWidth.set(window.innerWidth);
    if (!this.isMobile()) this.mobileOpen.set(false);
  }

  toggleCollapsed() { this.collapsed.update(v => !v); }
  openMobile()      { this.mobileOpen.set(true); }
  closeMobile()     { this.mobileOpen.set(false); }

  onNavClick() {
    if (this.isMobile()) this.mobileOpen.set(false);
  }

  logout() {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }

  private updateBreadcrumbs(url: string) {
    const segments = url.split('/').filter(s => s && s !== 'admin');
    const crumbs   = segments.map((seg, i) => ({
      path:  '/admin/' + segments.slice(0, i + 1).join('/'),
      label: this.routeLabels[seg] ?? (seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')),
    }));
    this.breadcrumbs.set(crumbs);
  }

  readonly navItems = [
    { path: '/admin/dashboard',  label: 'Dashboard',  badge: null, exact: true,  svgPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/admin/orders',     label: 'Orders',     badge: null, exact: false, svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { path: '/admin/products',   label: 'Products',   badge: null, exact: false, svgPath: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
    { path: '/admin/categories', label: 'Categories', badge: null, exact: false, svgPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { path: '/admin/inventory',  label: 'Inventory',  badge: null, exact: false, svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { path: '/admin/customers',  label: 'Customers',  badge: null, exact: false, svgPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/admin/coupons',    label: 'Coupons',    badge: null, exact: false, svgPath: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
    { path: '/admin/banners',    label: 'Banners',    badge: null, exact: false, svgPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/admin/returns',    label: 'Returns',    badge: null, exact: false, svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  ];
}
