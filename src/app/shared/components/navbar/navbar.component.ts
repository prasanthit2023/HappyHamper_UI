import {
  Component,
  signal,
  inject,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthStore } from '../../../state/auth.store';
import { CartStore } from '../../../state/cart.store';
import { WishlistStore } from '../../../state/wishlist.store';
import { ProductService } from '../../../core/services/product.service';
import { filter, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subscription, Subject, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'bb-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Top announcement bar -->
    @if (!announcementDismissed()) {
      <div class="announcement-bar">
        <i class="pi pi-truck" style="font-size: 0.8rem;"></i>
        &nbsp;Free Shipping on orders above &#8377;499 &nbsp;|&nbsp; Use code <strong>FIRST10</strong> for 10% off!
        <button class="announcement-bar-close" (click)="announcementDismissed.set(true)" aria-label="Dismiss announcement">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    }

    <!-- Main Navbar -->
    <header
      class="sticky top-0 z-50 transition-all duration-300 navbar-header"
      [class.navbar-scrolled]="isScrolled()"
    >
      <div class="w-full px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

          <!-- Left: Logo -->
          <a routerLink="/" class="flex items-center gap-2.5 group flex-shrink-0" aria-label="Happy Hamper Home">
            <div class="w-9 h-9 rounded-xl overflow-hidden border border-[var(--color-border)] group-hover:scale-105 transition-transform duration-200 shadow-sm">
              <img src="/favicon.png" alt="Happy Hamper Logo" class="w-full h-full object-cover" />
            </div>
            <div class="leading-none hidden sm:block">
              <div class="font-display font-black text-sm lg:text-base tracking-wider" style="color: var(--color-text);">HAPPY HAMPER</div>
              <div class="text-[6px] lg:text-[7px] font-bold tracking-widest uppercase mt-0.5" style="color: var(--color-primary);">presents BLUEBELL KIDS</div>
            </div>
          </a>

          <!-- Center: Search Bar -->
          <div class="hidden md:flex flex-1 max-w-xs lg:max-w-sm xl:max-w-md mx-6 relative">
            <div class="relative w-full group">
              <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm transition-colors group-focus-within:text-primary"></i>
              <input
                type="search"
                placeholder="Search for baby clothing, gifts..."
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                (input)="onSearchInput()"
                (focus)="onSearchFocus()"
                (blur)="onSearchBlur()"
                class="search-input w-full pl-10 pr-4 py-2.5 rounded-full text-sm outline-none transition-all duration-200"
                aria-label="Search products"
              />

              <!-- Suggestions Dropdown -->
              @if (suggestions().length > 0 && showSuggestions()) {
                <div class="suggestions-dropdown absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50 animate-scale-in text-left">
                  <div class="max-h-[360px] overflow-y-auto divide-y divide-neutral-100">
                    @for (s of suggestions(); track s.id) {
                      <a
                        [routerLink]="['/products', s.slug]"
                        (mousedown)="onSelectSuggestion($event, s.slug)"
                        class="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors cursor-pointer group"
                      >
                        <img
                          [src]="s.image || '/assets/placeholder-product.jpg'"
                          [alt]="s.title"
                          class="w-10 h-10 object-cover rounded-xl flex-shrink-0 bg-neutral-50"
                        />
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-semibold text-neutral-800 truncate group-hover:text-primary transition-colors">{{ s.title }}</p>
                          <div class="flex items-baseline gap-1.5 mt-0.5">
                            <span class="text-xs font-bold" style="color: var(--color-primary);">
                              <i class="bi bi-currency-rupee"></i>{{ (s.discountPrice || s.price) | number:'1.0-0' }}
                            </span>
                            @if (s.discountPrice && s.discountPrice < s.price) {
                              <span class="text-[10px] text-neutral-400 line-through"><i class="bi bi-currency-rupee"></i>{{ s.price | number:'1.0-0' }}</span>
                            }
                          </div>
                        </div>
                        <i class="pi pi-arrow-right text-xs text-neutral-300 group-hover:text-primary transition-colors"></i>
                      </a>
                    }
                  </div>
                  <div class="px-4 py-2.5 bg-neutral-50 text-center border-t border-neutral-100 text-[10px] text-neutral-400">
                    Press <span class="font-bold text-neutral-600">Enter</span> to search all results
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Right Actions -->
          <div class="flex items-center gap-1 xl:gap-2">

            <!-- Contact -->
            <a routerLink="/contact" class="nav-icon-btn flex items-center justify-center hidden xl:flex" aria-label="Customer Care" routerLinkActive="active-icon">
              <i class="fa-solid fa-headset"></i>
            </a>

            <!-- Wishlist -->
            @if (authStore.isLoggedIn()) {
              <a routerLink="/account/wishlist" class="nav-icon-btn flex items-center justify-center relative hidden md:flex" aria-label="Wishlist">
                <i class="pi pi-heart"></i>
                @if (wishlistStore.count() > 0) {
                  <span class="badge-dot">{{ wishlistStore.count() }}</span>
                }
              </a>
            }

            <!-- Cart -->
            <button (click)="cartStore.toggleDrawer()" class="nav-icon-btn flex items-center justify-center relative flex-shrink-0" aria-label="Shopping cart">
              <i class="pi pi-shopping-cart"></i>
              @if (cartStore.itemCount() > 0) {
                <span class="badge-dot animate-scale-in">{{ cartStore.itemCount() }}</span>
              }
            </button>

            <!-- User Menu -->
            @if (authStore.isLoggedIn()) {
              <div class="relative hidden xl:block">
                <button
                  class="user-btn flex items-center gap-2 rounded-xl px-3 py-2"
                  aria-label="User menu"
                  [attr.aria-expanded]="userMenuOpen()"
                  (click)="toggleUserMenu()"
                >
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                       style="background: var(--gradient-primary);">
                    {{ authStore.user()?.firstName?.charAt(0) }}
                  </div>
                  <i class="pi pi-chevron-down text-xs text-neutral-400 transition-transform duration-200"
                     [class.rotate-180]="userMenuOpen()"></i>
                </button>
                @if (userMenuOpen()) {
                  <div class="user-dropdown absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden animate-fade-in">
                    <div class="px-4 py-3 border-b border-neutral-100">
                      <div class="font-semibold text-sm text-neutral-900">{{ authStore.fullName() }}</div>
                      <div class="text-xs text-neutral-400 mt-0.5">{{ authStore.user()?.phone }}</div>
                    </div>
                    <div class="py-1.5">
                      <a routerLink="/account/dashboard" (click)="closeUserMenu()" class="dropdown-item flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700">
                        <i class="pi pi-user text-neutral-400 w-4"></i> My Account
                      </a>
                      <a routerLink="/account/orders" (click)="closeUserMenu()" class="dropdown-item flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700">
                        <i class="pi pi-box text-neutral-400 w-4"></i> My Orders
                      </a>
                      <a routerLink="/account/wishlist" (click)="closeUserMenu()" class="dropdown-item flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700">
                        <i class="pi pi-heart text-neutral-400 w-4"></i> Wishlist
                      </a>
                      @if (authStore.isAdmin()) {
                        <div class="h-px bg-neutral-100 mx-3 my-1"></div>
                        <a routerLink="/admin" (click)="closeUserMenu()" class="dropdown-item dropdown-admin flex items-center gap-3 px-4 py-2.5 text-sm font-semibold">
                          <i class="pi pi-cog w-4"></i> Admin Panel
                        </a>
                      }
                      <div class="h-px bg-neutral-100 mx-3 my-1"></div>
                      <button (click)="authStore.logout(); closeUserMenu()" class="dropdown-item w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                        <i class="pi pi-sign-out w-4"></i> Sign Out
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/login" class="btn-primary hidden xl:inline-flex items-center gap-1.5 text-xs px-4 py-2">
                <i class="pi pi-sign-in text-[11px]"></i> Sign In
              </a>
            }

            <!-- Mobile Menu Toggle -->
            <button
              (click)="toggleMobileMenu()"
              class="nav-icon-btn flex items-center justify-center xl:hidden flex-shrink-0"
              [attr.aria-expanded]="mobileMenuOpen()"
              aria-label="Toggle mobile menu"
            >
              @if (mobileMenuOpen()) {
                <i class="pi pi-times text-lg"></i>
              } @else {
                <i class="pi pi-bars text-lg"></i>
              }
            </button>
          </div>
        </div>
      </div>

      <!-- Category Navigation Strip -->
      <!-- <div class="category-strip border-t hidden xl:block" style="border-color: var(--color-border);">
        <div class="w-full px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
            <a routerLink="/products"
               routerLinkActive="cat-active"
               [routerLinkActiveOptions]="{exact: true}"
               class="cat-pill flex-shrink-0">
              <i class="pi pi-th-large text-[10px]"></i> All Products
            </a>
            @for (cat of categories(); track cat.id) {
              <a
                [routerLink]="['/products']"
                [queryParams]="{ category: cat.id }"
                class="cat-pill flex-shrink-0"
              >
                {{ cat.name }}
              </a>
            }
            <a routerLink="/products" [queryParams]="{ newArrival: true }" class="cat-pill cat-pill-accent flex-shrink-0">
              ✨ New Arrivals
            </a>
            <a routerLink="/products" [queryParams]="{ onSale: true }" class="cat-pill cat-pill-sale flex-shrink-0">
              🔥 Sale
            </a>
          </div>
        </div>
      </div> -->

      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
        <div class="xl:hidden mobile-menu-panel border-t overflow-y-auto max-h-[80vh]" style="border-color: var(--color-border);">
          <div class="w-full px-4 py-4 space-y-2">

            <!-- Mobile Search -->
            <div class="relative mb-3">
              <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm"></i>
              <input
                type="search"
                placeholder="Search products..."
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                (input)="onSearchInput()"
                (focus)="onSearchFocus()"
                (blur)="onSearchBlur()"
                class="search-input w-full pl-10 pr-4 py-2.5 rounded-full text-sm outline-none"
              />
              @if (suggestions().length > 0 && showSuggestions()) {
                <div class="suggestions-dropdown absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50 animate-scale-in">
                  <div class="max-h-[200px] overflow-y-auto divide-y divide-neutral-100">
                    @for (s of suggestions(); track s.id) {
                      <a [routerLink]="['/products', s.slug]"
                         (mousedown)="onSelectSuggestion($event, s.slug)"
                         class="flex items-center gap-2.5 p-2.5 hover:bg-neutral-50 transition-colors">
                        <img [src]="s.image || '/assets/placeholder-product.jpg'" class="w-8 h-8 object-cover rounded-lg" />
                        <span class="text-xs font-semibold text-neutral-700 truncate">{{ s.title }}</span>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Categories Section -->
            <div class="pb-2">
              <div class="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 mb-2">Shop by Category</div>
              <div class="grid grid-cols-3 gap-1.5">
                <a routerLink="/products" (click)="mobileMenuOpen.set(false)" class="mobile-cat-chip">
                  <i class="pi pi-th-large text-[10px]"></i> All
                </a>
                @for (cat of categories().slice(0, 8); track cat.id) {
                  <a [routerLink]="['/products']" [queryParams]="{ category: cat.id }"
                     (click)="mobileMenuOpen.set(false)" class="mobile-cat-chip">
                    {{ cat.name }}
                  </a>
                }
              </div>
            </div>

            <div class="h-px bg-neutral-100"></div>

            <!-- Main Links -->
            <a routerLink="/products" [queryParams]="{ newArrival: true }" (click)="mobileMenuOpen.set(false)" class="mobile-link flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold" style="color: var(--color-primary);">
              ✨ New Arrivals
            </a>
            <a routerLink="/products" [queryParams]="{ onSale: true }" (click)="mobileMenuOpen.set(false)" class="mobile-link flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-orange-500">
              🔥 Sale
            </a>
            <a routerLink="/contact" (click)="mobileMenuOpen.set(false)" class="mobile-link flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700">
              <i class="fa-solid fa-headset text-neutral-400"></i> Contact
            </a>

            <div class="h-px bg-neutral-100"></div>

            @if (authStore.isLoggedIn()) {
              <div class="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 pt-1">My Account</div>
              <a routerLink="/account/dashboard" (click)="mobileMenuOpen.set(false)" class="mobile-link flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700">
                <i class="pi pi-user text-neutral-400"></i> Dashboard
              </a>
              <a routerLink="/account/orders" (click)="mobileMenuOpen.set(false)" class="mobile-link flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700">
                <i class="pi pi-box text-neutral-400"></i> My Orders
              </a>
              <a routerLink="/account/wishlist" (click)="mobileMenuOpen.set(false)" class="mobile-link flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700">
                <i class="pi pi-heart text-neutral-400"></i> Wishlist
              </a>
              @if (authStore.isAdmin()) {
                <a routerLink="/admin" (click)="mobileMenuOpen.set(false)" class="mobile-link flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold" style="color: var(--color-primary);">
                  <i class="pi pi-cog"></i> Admin Panel
                </a>
              }
              <button (click)="authStore.logout(); mobileMenuOpen.set(false)" class="mobile-link w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">
                <i class="pi pi-sign-out"></i> Sign Out
              </button>
            } @else {
              <a routerLink="/login" (click)="mobileMenuOpen.set(false)" class="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                <i class="pi pi-sign-in text-sm"></i> Sign In
              </a>
            }
          </div>
        </div>
      }
    </header>
  `,
  styles: [`
    /* ── Navbar base ──────────────────────────────────────── */
    .navbar-header {
      background: rgba(255,255,255,0.95);
      border-bottom: 1px solid var(--color-bg-subtle);
    }
    .navbar-scrolled {
      background: rgba(255,255,255,0.85) !important;
      backdrop-filter: blur(16px) saturate(1.5);
      -webkit-backdrop-filter: blur(16px) saturate(1.5);
      border-bottom-color: var(--color-border) !important;
      box-shadow: 0 2px 20px rgba(0,0,0,0.06);
    }

    /* ── Search ───────────────────────────────────────────── */
    .search-input {
      background: var(--color-bg-subtle);
      border: 1.5px solid var(--color-border);
      color: var(--color-text);
      transition: all 0.2s;
    }
    .search-input:focus {
      background: white;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(124,131,195,0.15);
    }
    .suggestions-dropdown {
      background: white;
      border: 1px solid var(--color-border);
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
    }

    /* ── Nav Icon Buttons ─────────────────────────────────── */
    .nav-icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      color: var(--color-text-muted);
      font-size: 1.1rem;
      transition: all 0.2s;
      position: relative;
      cursor: pointer;
      border: none;
      background: transparent;
    }
    .nav-icon-btn:hover, .active-icon {
      background: var(--color-bg-subtle);
      color: var(--color-primary);
    }
    .badge-dot {
      position: absolute;
      top: -3px;
      right: -3px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 9px;
      background: var(--gradient-accent);
      color: white;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ── User Menu ────────────────────────────────────────── */
    .user-btn {
      transition: all 0.2s;
      cursor: pointer;
      border: none;
      background: transparent;
    }
    .user-btn:hover { background: var(--color-bg-subtle); }
    .user-dropdown {
      background: white;
      border: 1px solid var(--color-border);
      box-shadow: 0 8px 40px rgba(0,0,0,0.12);
      z-index: 60;
    }
    .dropdown-item { transition: background 0.15s; }
    .dropdown-item:hover { background: var(--color-bg-subtle); }
    .dropdown-admin { color: var(--color-primary); }
    .dropdown-admin:hover { background: var(--color-primary-light); }

    /* ── Category Strip ───────────────────────────────────── */
    .category-strip {
      background: transparent;
    }
    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text-muted);
      transition: all 0.2s;
      white-space: nowrap;
      text-decoration: none;
    }
    .cat-pill:hover, .cat-active {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }
    .cat-pill-accent {
      color: var(--color-primary);
      font-weight: 700;
    }
    .cat-pill-accent:hover {
      background: var(--color-primary-light);
    }
    .cat-pill-sale {
      color: #ea580c;
      font-weight: 700;
    }
    .cat-pill-sale:hover {
      background: #fff7ed;
    }

    /* ── Mobile Menu ──────────────────────────────────────── */
    .mobile-menu-panel {
      background: white;
      animation: slideDown 0.2s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .mobile-link:hover { background: var(--color-bg-subtle); }
    .mobile-cat-chip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      color: var(--color-text-muted);
      background: var(--color-bg-subtle);
      text-align: center;
      text-decoration: none;
      transition: all 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mobile-cat-chip:hover {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  readonly wishlistStore = inject(WishlistStore);
  readonly router = inject(Router);
  private productService = inject(ProductService);
  private http = inject(HttpClient);

  readonly isScrolled = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly suggestions = signal<any[]>([]);
  readonly showSuggestions = signal(false);
  readonly announcementDismissed = signal(false);
  readonly userMenuOpen = signal(false);
  readonly categories = signal<any[]>([]);
  searchQuery = '';

  private routerSubscription?: Subscription;
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  ngOnInit() {
    this.loadCategories();
  }

  constructor() {
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      const urlTree = this.router.parseUrl(this.router.url);
      this.searchQuery = urlTree.queryParams['q'] || '';
      this.showSuggestions.set(false);
      this.mobileMenuOpen.set(false);
      this.userMenuOpen.set(false);
    });

    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => {
        if (query.trim().length < 2) return of({ data: [] });
        return this.productService.autocomplete(query).pipe(catchError(() => of({ data: [] })));
      })
    ).subscribe((res) => {
      this.suggestions.set(res.data || []);
    });
  }

  loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => this.categories.set(res.data || []),
      error: () => { }
    });
  }

  onSearchFocus() {
    this.showSuggestions.set(true);
    if (this.searchQuery.trim().length >= 2 && this.suggestions().length === 0) {
      this.searchSubject.next(this.searchQuery);
    }
  }

  onSearchBlur() {
    setTimeout(() => this.showSuggestions.set(false), 200);
  }

  onSelectSuggestion(event: MouseEvent, slug: string) {
    event.preventDefault();
    event.stopPropagation();
    this.showSuggestions.set(false);
    this.router.navigate(['/products', slug]);
    this.mobileMenuOpen.set(false);
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  @HostListener('window:scroll')
  onScroll() { this.isScrolled.set(window.scrollY > 20); }

  toggleUserMenu() { this.userMenuOpen.update(v => !v); }
  closeUserMenu() { this.userMenuOpen.set(false); }
  toggleMobileMenu() { this.mobileMenuOpen.update(v => !v); }

  onSearch() {
    const query = this.searchQuery.trim();
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
    } else {
      this.router.navigate(['/products']);
    }
    this.mobileMenuOpen.set(false);
    this.showSuggestions.set(false);
  }

  onSearchInput() {
    if (!this.searchQuery.trim()) {
      this.suggestions.set([]);
    } else {
      this.searchSubject.next(this.searchQuery);
    }
  }
}
