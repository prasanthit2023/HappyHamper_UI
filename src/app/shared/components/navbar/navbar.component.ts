import {
  Component,
  signal,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../state/auth.store';
import { CartStore } from '../../../state/cart.store';
import { WishlistStore } from '../../../state/wishlist.store';

@Component({
  selector: 'bb-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Top announcement bar -->
    <div class="py-2 text-center text-white text-xs font-medium tracking-wide flex items-center justify-center gap-1.5"
         style="background: var(--gradient-primary);">
      <i class="pi pi-truck text-white" style="font-size: 0.85rem;"></i>
      <span>Free Shipping on orders above ₹499 &nbsp;|&nbsp; Use code <strong>FIRST10</strong> for 10% off!</span>
    </div>

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
            <a routerLink="/products" class="flex items-center gap-2 group animate-fade-in flex-shrink-0" aria-label="Happy Hamper Home">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-light border border-primary-200 group-hover:scale-105 transition-transform" style="box-shadow: var(--shadow-sm);">
                <i class="pi pi-gift text-primary text-xl"></i>
              </div>
              <div class="leading-none">
                <div class="font-display font-black text-sm lg:text-base xl:text-lg tracking-wider" style="color: var(--color-text);">HAPPY HAMPER</div>
                <div class="text-[6px] lg:text-[7px] xl:text-[8px] font-bold tracking-widest text-primary uppercase mt-0.5">presents BLUEBELL KIDS</div>
              </div>
            </a>

          </div>

          <!-- Search Bar -->
          <div class="hidden md:flex flex-1 max-w-[180px] lg:max-w-[160px] xl:max-w-xs mx-4 xl:mx-6 relative">
            <div class="relative w-full">
              <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"></i>
              <input
                type="text"
                placeholder="Search products..."
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                (input)="onSearchInput()"
                class="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm outline-none transition-all duration-200 search-input"
                aria-label="Search products"
              />
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
              <a routerLink="/account/wishlist" class="btn-icon relative hidden lg:flex" aria-label="Wishlist">
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

            <!-- User Menu -->
            @if (authStore.isLoggedIn()) {
              <div class="relative group hidden lg:block">
                <button class="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover-user-btn" aria-label="User menu">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                       style="background: var(--gradient-primary);">
                    {{ authStore.user()?.firstName?.charAt(0) }}
                  </div>
                  <i class="pi pi-chevron-down text-xs text-neutral-400 transition-transform group-hover:rotate-180"></i>
                </button>
                <div class="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-float border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden"
                     style="border-color: var(--color-border);">
                  <div class="px-4 py-3" style="border-bottom: 1px solid var(--color-border);">
                    <div class="font-semibold text-sm text-neutral-900">{{ authStore.fullName() }}</div>
                    <div class="text-xs text-neutral-400">{{ authStore.user()?.email }}</div>
                  </div>
                  <div class="py-2">
                    <a routerLink="/account/dashboard" class="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors dropdown-item">
                      <i class="pi pi-user text-neutral-400"></i>
                      My Account
                    </a>
                    <a routerLink="/account/orders" class="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors dropdown-item">
                      <i class="pi pi-box text-neutral-400"></i>
                      My Orders
                    </a>
                    @if (authStore.isAdmin()) {
                      <a routerLink="/admin" class="flex items-center gap-3 px-4 py-2 text-sm font-semibold transition-colors dropdown-admin-item">
                        <i class="pi pi-cog"></i>
                        Admin Panel
                      </a>
                    }
                    <hr style="margin: 4px 0; border-color: var(--color-border);">
                    <button (click)="authStore.logout()" class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <i class="pi pi-sign-out"></i>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <a routerLink="/auth/login" class="btn-primary hidden lg:inline-flex text-xs px-4 py-2">
                Sign In
              </a>
            }

            <!-- Mobile Menu Toggle -->
            <button (click)="toggleMobileMenu()" class="btn-icon lg:hidden flex-shrink-0" aria-label="Toggle mobile menu">
              @if (mobileMenuOpen()) {
                <i class="pi pi-times text-lg"></i>
              } @else {
                <i class="pi pi-bars text-lg"></i>
              }
            </button>
          </div>
        </div>
      </div>

      <!-- Category Bar (desktop) -->
      <div class="hidden lg:block border-t" style="border-color: var(--color-border); background: var(--color-bg-subtle);">
        <div class="bb-container">
          <div class="category-bar py-2.5 flex items-center gap-1">
            @for (cat of categoryBar; track cat.label) {
              <a
                [routerLink]="cat.path"
                [queryParams]="cat.query"
                class="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium text-neutral-600 transition-all duration-200 whitespace-nowrap category-link"
              >
                {{ cat.label }}
              </a>
            }
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden border-t bg-white animate-slide-down overflow-y-auto max-h-[85vh]" style="border-color: var(--color-border);">
          <div class="bb-container py-4 space-y-1">
            <div class="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Search..."
                [(ngModel)]="searchQuery"
                (keyup.enter)="onSearch()"
                class="input-field flex-1"
              />
              <button (click)="onSearch()" class="btn-primary px-4 py-2">Search</button>
            </div>
            <a routerLink="/products" (click)="mobileMenuOpen.set(false)" class="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">Products</a>
            <a routerLink="/contact" (click)="mobileMenuOpen.set(false)" class="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">Contact</a>

            @if (authStore.isLoggedIn()) {
              <hr style="border-color: var(--color-border); margin: 8px 0;">
              <a routerLink="/account/orders" (click)="mobileMenuOpen.set(false)" class="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">My Orders</a>
              <a routerLink="/account/wishlist" (click)="mobileMenuOpen.set(false)" class="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">Wishlist</a>
              <button (click)="authStore.logout(); mobileMenuOpen.set(false)" class="w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">Sign Out</button>
            } @else {
              <a routerLink="/auth/login" (click)="mobileMenuOpen.set(false)" class="btn-primary w-full mt-2">Sign In</a>
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
      box-shadow: 0 0 0 3px rgba(46, 175, 176, 0.12);
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
export class NavbarComponent {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  readonly wishlistStore = inject(WishlistStore);
  readonly router = inject(Router);

  readonly isScrolled = signal(false);
  readonly mobileMenuOpen = signal(false);
  searchQuery = '';

  categoryBar = [
    { label: 'New Arrivals', path: '/products', query: { newArrival: true } },
    { label: 'Best Sellers', path: '/products', query: { bestSeller: true } },
    { label: 'Jablas', path: '/category/jablas', query: null },
    { label: 'Nappies & Diapers', path: '/category/nappies-diapers', query: null },
    { label: 'Swaddles & Blankets', path: '/category/swaddles-blankets', query: null },
    { label: 'Accessories', path: '/category/accessories', query: null },
    { label: 'Combo Packs', path: '/category/combos', query: null },
    { label: '0-3 Months', path: '/products', query: { tags: '0-3months' } },
    { label: '3-6 Months', path: '/products', query: { tags: '3-6months' } },
    { label: '6-12 Months', path: '/products', query: { tags: '6-12months' } },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled.set(window.scrollY > 20);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update((v) => !v);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
      this.mobileMenuOpen.set(false);
    }
  }

  onSearchInput() {
    // Autocomplete handled separately
  }
}
