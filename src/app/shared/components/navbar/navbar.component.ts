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
      <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h5m4 0h5"/>
      </svg>
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

          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2.5 group" aria-label="Happy Hamper Home">
            <div class="w-9 h-9 rounded-xl overflow-hidden shadow-warm group-hover:scale-105 transition-transform">
              <img src="/logo.jpg" alt="Happy Hamper Logo" class="w-full h-full object-cover" />
            </div>
            <div class="hidden sm:block">
              <span class="font-display font-bold text-xl" style="color: var(--color-text);">Happy</span>
              <span class="font-display font-bold text-xl" style="color: var(--color-primary);">Hamper</span>
            </div>
          </a>

          <!-- Desktop Navigation -->
          <nav class="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            <a routerLink="/" routerLinkActive="nav-link-active" [routerLinkActiveOptions]="{exact:true}" class="nav-link">Home</a>
            <div class="relative group">
              <button class="nav-link flex items-center gap-1">
                Shop
                <svg class="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <!-- Mega dropdown -->
              <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-float border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4 space-y-1" style="border-color: var(--color-border);">
                <a routerLink="/products" [queryParams]="{newArrival: true}" class="flex items-center gap-3 p-2 rounded-xl transition-colors hover-dropdown">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--color-primary-light);">
                    <svg class="w-4 h-4" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                    </svg>
                  </span>
                  <div>
                    <div class="font-semibold text-sm text-neutral-800">New Arrivals</div>
                    <div class="text-xs text-neutral-400">Latest collection</div>
                  </div>
                </a>
                <a routerLink="/products" [queryParams]="{bestSeller: true}" class="flex items-center gap-3 p-2 rounded-xl transition-colors hover-dropdown">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background: var(--color-accent-light);">
                    <svg class="w-4 h-4" style="color: var(--color-accent);" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </span>
                  <div>
                    <div class="font-semibold text-sm text-neutral-800">Best Sellers</div>
                    <div class="text-xs text-neutral-400">Most loved products</div>
                  </div>
                </a>
                <a routerLink="/products" class="flex items-center gap-3 p-2 rounded-xl transition-colors hover-dropdown">
                  <span class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background: #FAF5FF;">
                    <svg class="w-4 h-4" style="color: var(--color-purple);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/>
                    </svg>
                  </span>
                  <div>
                    <div class="font-semibold text-sm text-neutral-800">All Products</div>
                    <div class="text-xs text-neutral-400">Browse everything</div>
                  </div>
                </a>
              </div>
            </div>
            <a routerLink="/products" [queryParams]="{category: 'offers'}" class="nav-link">Offers</a>
          </nav>

          <!-- Search Bar -->
          <div class="hidden md:flex flex-1 max-w-xs mx-6 relative">
            <div class="relative w-full">
              <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
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

            <!-- Wishlist -->
            @if (authStore.isLoggedIn()) {
              <a routerLink="/account/wishlist" class="btn-icon relative hidden sm:flex" aria-label="Wishlist">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
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
              class="btn-icon relative"
              aria-label="Shopping cart"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/>
              </svg>
              @if (cartStore.itemCount() > 0) {
                <span class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-xs flex items-center justify-center font-bold animate-scale-in"
                      style="background: var(--gradient-accent);">
                  {{ cartStore.itemCount() }}
                </span>
              }
            </button>

            <!-- User Menu -->
            @if (authStore.isLoggedIn()) {
              <div class="relative group hidden sm:block">
                <button class="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover-user-btn" aria-label="User menu">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                       style="background: var(--gradient-primary);">
                    {{ authStore.user()?.firstName?.charAt(0) }}
                  </div>
                  <svg class="w-4 h-4 text-neutral-400 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <div class="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-float border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden"
                     style="border-color: var(--color-border);">
                  <div class="px-4 py-3" style="border-bottom: 1px solid var(--color-border);">
                    <div class="font-semibold text-sm text-neutral-900">{{ authStore.fullName() }}</div>
                    <div class="text-xs text-neutral-400">{{ authStore.user()?.email }}</div>
                  </div>
                  <div class="py-2">
                    <a routerLink="/account/dashboard" class="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors dropdown-item">
                      <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      My Account
                    </a>
                    <a routerLink="/account/orders" class="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 transition-colors dropdown-item">
                      <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                      My Orders
                    </a>
                    @if (authStore.isAdmin()) {
                      <a routerLink="/admin" class="flex items-center gap-3 px-4 py-2 text-sm font-semibold transition-colors dropdown-admin-item">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Admin Panel
                      </a>
                    }
                    <hr style="margin: 4px 0; border-color: var(--color-border);">
                    <button (click)="authStore.logout()" class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <a routerLink="/auth/login" class="btn-primary hidden sm:inline-flex text-xs px-4 py-2">
                Sign In
              </a>
            }

            <!-- Mobile Menu Toggle -->
            <button (click)="toggleMobileMenu()" class="btn-icon lg:hidden" aria-label="Toggle mobile menu">
              @if (mobileMenuOpen()) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              } @else {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
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
        <div class="lg:hidden border-t bg-white animate-slide-down" style="border-color: var(--color-border);">
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
            <a routerLink="/" (click)="mobileMenuOpen.set(false)" class="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">Home</a>
            <a routerLink="/products" (click)="mobileMenuOpen.set(false)" class="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">All Products</a>
            <a routerLink="/products" [queryParams]="{newArrival: true}" (click)="mobileMenuOpen.set(false)" class="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">New Arrivals</a>
            <a routerLink="/products" [queryParams]="{bestSeller: true}" (click)="mobileMenuOpen.set(false)" class="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-700 transition-colors mobile-link">Best Sellers</a>
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
  readonly authStore     = inject(AuthStore);
  readonly cartStore     = inject(CartStore);
  readonly wishlistStore = inject(WishlistStore);
  readonly router        = inject(Router);

  readonly isScrolled     = signal(false);
  readonly mobileMenuOpen = signal(false);
  searchQuery = '';

  categoryBar = [
    { label: 'New Arrivals',  path: '/products', query: { newArrival: true } },
    { label: 'Best Sellers',  path: '/products', query: { bestSeller: true } },
    { label: 'Newborn',       path: '/category/newborn', query: null },
    { label: 'Toddlers',      path: '/category/toddlers', query: null },
    { label: 'Girls',         path: '/category/girls', query: null },
    { label: 'Boys',          path: '/category/boys', query: null },
    { label: 'Dresses',       path: '/category/dresses', query: null },
    { label: 'Sleepwear',     path: '/category/sleepwear', query: null },
    { label: 'Ethnic Wear',   path: '/category/ethnic', query: null },
    { label: 'Sale',          path: '/products', query: { onSale: true } },
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
