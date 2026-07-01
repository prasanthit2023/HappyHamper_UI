import {
  Component,
  signal,
  inject,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../state/auth.store';
import { CartStore } from '../../../state/cart.store';
import { WishlistStore } from '../../../state/wishlist.store';
import { ProductService } from '../../../core/services/product.service';
import { filter, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Subscription, Subject, of } from 'rxjs';

@Component({
  selector: 'bb-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Top announcement bar -->
    @if (!announcementDismissed()) {
      <div class="announcement-bar">
        <i class="pi pi-truck text-white" style="font-size: 0.85rem;"></i>
        &nbsp;Free Shipping on orders above \u20B9499 &nbsp;|&nbsp; Use code <strong>FIRST10</strong> for 10% off!
        <button class="announcement-bar-close" (click)="announcementDismissed.set(true)" aria-label="Dismiss announcement">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    }

    
    <!-- Main Navbar -->
    <header
      class="sticky top-0 z-50 bg-white transition-all duration-300"
      [class.shadow-navbar]="isScrolled()"
      [style.borderBottom]="isScrolled() ? '1px solid var(--color-border)' : '1px solid var(--color-bg-subtle)'"
    >
      <div class="bb-container">
        <div class="flex items-center justify-between h-16">

          <!-- Left side: Logo & Navigation Group -->
          <div class="flex items-center gap-4 xl:gap-8 flex-shrink-0 min-w-0">
            <!-- Logo -->
            <a routerLink="/" class="flex items-center gap-2 group animate-fade-in flex-shrink-0" aria-label="Happy Hamper Home">

              <div class="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center border border-[var(--color-border)] group-hover:scale-105 transition-transform" style="box-shadow: var(--shadow-sm);">
                <img src="/favicon.png" alt="Happy Hamper Logo" class="w-full h-full object-cover" />
              </div>
              <div class="leading-none">
                <div class="font-display font-black text-sm lg:text-base xl:text-lg tracking-wider" style="color: var(--color-text);">HAPPY HAMPER</div>
                <div class="text-[6px] lg:text-[7px] xl:text-[8px] font-bold tracking-widest text-primary uppercase mt-0.5">presents BLUEBELL KIDS</div>
              </div>
            </a>

          </div>

          <!-- Search Bar -->
          <div class="hidden md:flex flex-1 max-w-[200px] lg:max-w-[320px] xl:max-w-md mx-4 xl:mx-6 relative">

            <div class="relative w-full">
              <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"></i>
              <input
                type="search"
                placeholder="Search products..."
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                (input)="onSearchInput()"
                (focus)="onSearchFocus()"
                (blur)="onSearchBlur()"
                class="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm outline-none transition-all duration-200 search-input"
                aria-label="Search products"
              />

              <!-- Suggestions Dropdown -->
              @if (suggestions().length > 0 && showSuggestions()) {
                <div class="absolute left-0 right-0 mt-2 bg-white rounded-2xl border shadow-float overflow-hidden z-50 animate-scale-in text-left"
                     style="border-color: var(--color-border);">
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
                          class="w-10 h-10 object-cover rounded-lg flex-shrink-0 bg-neutral-50"
                        />
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-semibold text-neutral-800 truncate group-hover:text-primary transition-colors">
                            {{ s.title }}
                          </p>
                          <div class="flex items-baseline gap-1.5 mt-0.5">
                            <span class="text-xs font-bold text-primary">
                              <i class="bi bi-currency-rupee"></i>{{ (s.discountPrice || s.price) | number:'1.0-0' }}
                            </span>
                            @if (s.discountPrice && s.discountPrice < s.price) {
                              <span class="text-[10px] text-neutral-400 line-through"><i class="bi bi-currency-rupee"></i>{{ s.price | number:'1.0-0' }}</span>
                            }
                          </div>
                        </div>
                      </a>
                    }
                  </div>
                  <div class="p-2.5 bg-neutral-50 text-center border-t text-[10px] text-neutral-400">
                    Press <span class="font-bold">Enter</span> to search all results
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Right Actions -->
          <div class="flex items-center gap-2">

            <!-- Contact -->
            <a routerLink="/contact" class="btn-icon relative hidden lg:flex" aria-label="Customer Care" routerLinkActive="text-primary">
              <i class="pi pi-headphones text-lg"></i>
            </a>

            <!-- Wishlist -->
            @if (authStore.isLoggedIn()) {
              <a routerLink="/account/wishlist" class="btn-icon relative hidden md:flex" aria-label="Wishlist">

                <i class="pi pi-heart text-lg"></i>
                @if (wishlistStore.count() > 0) {
                  <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {{ wishlistStore.count() }}
                  </span>
                }
              </a>
            }

            <!-- Cart Button -->
            <button
              (click)="cartStore.toggleDrawer()"
              class="btn-icon relative flex-shrink-0"
              aria-label="Shopping cart"
            >
              <i class="pi pi-shopping-cart text-lg"></i>
              @if (cartStore.itemCount() > 0) {
                <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-xs flex items-center justify-center font-bold animate-scale-in"
                      style="background: var(--gradient-accent);">
                  {{ cartStore.itemCount() }}
                </span>
              }
            </button>

            <!-- User Menu (click-to-open — works on touch/tablet) -->
            @if (authStore.isLoggedIn()) {
              <div class="relative hidden lg:block">
                <button
                  class="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover-user-btn"
                  aria-label="User menu"
                  [attr.aria-expanded]="userMenuOpen()"
                  aria-controls="user-dropdown"
                  (click)="toggleUserMenu()"
                >
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                       style="background: var(--gradient-primary);">
                    {{ authStore.user()?.firstName?.charAt(0) }}
                  </div>
                  <i class="pi pi-chevron-down text-xs text-neutral-400 transition-transform"
                     [class.rotate-180]="userMenuOpen()"></i>
                </button>
                @if (userMenuOpen()) {
                  <div id="user-dropdown" class="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-float border overflow-hidden animate-fade-in"
                       style="border-color: var(--color-border); z-index: 60;">
                    <div class="px-4 py-3" style="border-bottom: 1px solid var(--color-border);">
                      <div class="font-semibold text-sm text-neutral-900">{{ authStore.fullName() }}</div>
                      <div class="text-xs text-neutral-400">{{ authStore.user()?.phone }}</div>
                    </div>
                    <div class="py-2">
                      <a routerLink="/account/dashboard" (click)="closeUserMenu()" class="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors dropdown-item">
                        <i class="pi pi-user text-neutral-400"></i>
                        My Account
                      </a>
                      <a routerLink="/account/orders" (click)="closeUserMenu()" class="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors dropdown-item">
                        <i class="pi pi-box text-neutral-400"></i>
                        My Orders
                      </a>
                      @if (authStore.isAdmin()) {
                        <a routerLink="/admin" (click)="closeUserMenu()" class="flex items-center gap-3 px-4 py-2 text-sm font-semibold transition-colors dropdown-admin-item">
                          <i class="pi pi-cog"></i>
                          Admin Panel
                        </a>
                      }
                      <hr style="margin: 4px 0; border-color: var(--color-border);">
                      <button (click)="authStore.logout(); closeUserMenu()" class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <i class="pi pi-sign-out"></i>
                        Sign Out
                      </button>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/login" class="btn-primary hidden lg:inline-flex text-xs px-4 py-2">
                Sign In
              </a>
            }


            <!-- Mobile Menu Toggle -->
            <button
              (click)="toggleMobileMenu()"
              class="btn-icon lg:hidden flex-shrink-0"
              [attr.aria-expanded]="mobileMenuOpen()"
              aria-controls="mobile-menu"
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



      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
        <div id="mobile-menu" class="lg:hidden border-t bg-white animate-slide-down overflow-y-auto max-h-[85vh]" style="border-color: var(--color-border);">
          <div class="bb-container py-4 space-y-1">
            <div class="flex gap-2 mb-4 relative">
              <input
                type="search"
                placeholder="Search..."
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                (input)="onSearchInput()"
                (focus)="onSearchFocus()"
                (blur)="onSearchBlur()"
                class="input-field flex-1"
              />
              <button (click)="onSearch()" class="btn-primary px-4 py-2">Search</button>

              <!-- Mobile Suggestions Dropdown -->
              @if (suggestions().length > 0 && showSuggestions()) {
                <div class="absolute left-0 right-16 top-full mt-1 bg-white rounded-xl border shadow-lg overflow-hidden z-50 animate-scale-in text-left"
                     style="border-color: var(--color-border);">
                  <div class="max-h-[240px] overflow-y-auto divide-y divide-neutral-100">
                    @for (s of suggestions(); track s.id) {
                      <a
                        [routerLink]="['/products', s.slug]"
                        (mousedown)="onSelectSuggestion($event, s.slug)"
                        class="flex items-center gap-3 p-2.5 hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <img
                          [src]="s.image || '/assets/placeholder-product.jpg'"
                          [alt]="s.title"
                          class="w-8 h-8 object-cover rounded-md flex-shrink-0 bg-neutral-50"
                        />
                        <div class="flex-1 min-w-0">
                          <p class="text-[11px] font-semibold text-neutral-800 truncate">
                            {{ s.title }}
                          </p>
                          <div class="flex items-baseline gap-1 mt-0.5">
                            <span class="text-[10px] font-bold text-primary">
                              <i class="bi bi-currency-rupee"></i>{{ (s.discountPrice || s.price) | number:'1.0-0' }}
                            </span>
                            @if (s.discountPrice && s.discountPrice < s.price) {
                              <span class="text-[9px] text-neutral-400 line-through"><i class="bi bi-currency-rupee"></i>{{ s.price | number:'1.0-0' }}</span>
                            }
                          </div>
                        </div>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Mobile nav links -->
            <a routerLink="/" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">
              <i class="pi pi-tag text-neutral-400"></i> Products
            </a>
            <a routerLink="/contact" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">
              <i class="pi pi-headphones text-neutral-400"></i> Contact
            </a>

            @if (authStore.isLoggedIn()) {
              <hr style="border-color: var(--color-border); margin: 8px 0;">
              <a routerLink="/account/dashboard" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">
                <i class="pi pi-user text-neutral-400"></i> My Account
              </a>
              <a routerLink="/account/orders" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">
                <i class="pi pi-box text-neutral-400"></i> My Orders
              </a>
              <a routerLink="/account/wishlist" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">
                <i class="pi pi-heart text-neutral-400"></i> Wishlist
              </a>
              @if (authStore.isAdmin()) {
                <a routerLink="/admin" (click)="mobileMenuOpen.set(false)" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors mobile-link" style="color: var(--color-primary);">
                  <i class="pi pi-cog"></i> Admin Panel
                </a>
              }
              <button (click)="authStore.logout(); mobileMenuOpen.set(false)" class="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                <i class="pi pi-sign-out"></i> Sign Out
              </button>
            } @else {
              <a routerLink="/login" (click)="mobileMenuOpen.set(false)" class="btn-primary w-full mt-2">Sign In</a>
            }
          </div>
        </div>
      }
    </header>

  `,
  styles: [`
    .hover-dropdown:hover {
      background-color: var(--color-bg-subtle);
    }
    .search-input {
      background: var(--color-bg-subtle);
      border-color: var(--color-border);
      color: var(--color-text);
    }
    .search-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(124, 131, 195, 0.15);
      background: var(--color-surface);
    }

    .hover-user-btn:hover {
      background-color: var(--color-bg-subtle);
    }
    .dropdown-item:hover {
      background-color: var(--color-bg-subtle);
    }
    .dropdown-admin-item {
      color: var(--color-primary);
    }
    .dropdown-admin-item:hover {
      background-color: var(--color-primary-light);
    }
    .category-link:hover {
      background-color: var(--color-primary-light);
      color: var(--color-primary-dark);
    }
    .mobile-link:hover {
      background-color: var(--color-bg-subtle);
    }
  `]
})
export class NavbarComponent implements OnDestroy {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  readonly wishlistStore = inject(WishlistStore);
  readonly router = inject(Router);
  private productService = inject(ProductService);

  readonly isScrolled        = signal(false);
  readonly mobileMenuOpen    = signal(false);
  readonly suggestions       = signal<any[]>([]);
  readonly showSuggestions   = signal(false);
  readonly announcementDismissed = signal(false);
  readonly userMenuOpen      = signal(false);
  searchQuery = '';

  private routerSubscription?: Subscription;
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  constructor() {
    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      const urlTree = this.router.parseUrl(this.router.url);
      this.searchQuery = urlTree.queryParams['q'] || '';
      this.showSuggestions.set(false);
    });

    // Setup debounced search suggestions
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => {
        if (query.trim().length < 2) {
          return of({ data: [] });
        }
        return this.productService.autocomplete(query).pipe(
          catchError(() => of({ data: [] }))
        );
      })
    ).subscribe((res) => {
      this.suggestions.set(res.data || []);
    });
  }

  onSearchFocus() {
    this.showSuggestions.set(true);
    if (this.searchQuery.trim().length >= 2 && this.suggestions().length === 0) {
      this.searchSubject.next(this.searchQuery);
    }
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  onSelectSuggestion(event: MouseEvent, slug: string) {
    event.preventDefault();
    event.stopPropagation();
    this.showSuggestions.set(false);
    this.router.navigate(['/products', slug]);
    this.mobileMenuOpen.set(false);
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 20);
  }

  toggleUserMenu() { this.userMenuOpen.update(v => !v); }
  closeUserMenu()  { this.userMenuOpen.set(false); }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }


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
      // Bug fix: do NOT navigate away — just clear suggestions silently
      this.suggestions.set([]);
    } else {
      this.searchSubject.next(this.searchQuery);
    }
  }

}
