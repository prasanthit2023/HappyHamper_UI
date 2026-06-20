import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthStore } from '../../../state/auth.store';

@Component({
  selector: 'bb-profile-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="bb-container py-10 page-enter animate-fade-in">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar Navigation -->
        <aside class="col-span-1 space-y-6">
          <!-- User Summary Card -->
          <div class="card p-6 text-center space-y-4 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm">
            <div class="w-20 h-20 text-white rounded-full flex items-center justify-center text-3xl font-extrabold mx-auto shadow-md"
                 style="background: var(--gradient-primary)">
              {{ authStore.user()?.firstName?.charAt(0) || 'U' }}
            </div>
            <div>
              <h2 class="font-bold text-lg text-[var(--color-text)]">{{ authStore.fullName() }}</h2>
              <p class="text-xs text-[var(--color-text-muted)] mt-0.5 font-medium">{{ authStore.user()?.phone }}</p>
            </div>
            <div class="bg-[var(--color-accent-light)] text-[var(--color-text-muted)] border border-[var(--color-border)] px-3 py-1 rounded-full text-xs font-bold inline-block capitalize">
              Role: {{ authStore.user()?.role || 'Customer' }}
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="card p-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 whitespace-nowrap scrollbar-hide bg-white border border-[var(--color-border)] rounded-2xl shadow-sm">
            <a
              routerLink="/products"
              class="flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)] transition-all font-bold"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Continue Shopping
            </a>
            <hr class="hidden lg:block my-2 border-[var(--color-border)]">
            <a
              routerLink="/account/dashboard"
              routerLinkActive="bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold shadow-sm"
              class="flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              Dashboard
            </a>
            <a
              routerLink="/account/orders"
              routerLinkActive="bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold shadow-sm"
              class="flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/>
              </svg>
              My Orders
            </a>
            <a
              routerLink="/account/wishlist"
              routerLinkActive="bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold shadow-sm"
              class="flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              Wishlist
            </a>
            <a
              routerLink="/account/addresses"
              routerLinkActive="bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold shadow-sm"
              class="flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Addresses
            </a>
            <a
              routerLink="/account/profile"
              routerLinkActive="bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold shadow-sm"
              class="flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Edit Profile
            </a>
            <a
              routerLink="/account/notifications"
              routerLinkActive="bg-[var(--color-primary-light)] text-[var(--color-primary)] font-bold shadow-sm"
              class="flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              Notifications
            </a>
            <hr class="hidden lg:block my-2 border-[var(--color-border)]">
            <button
              (click)="authStore.logout()"
              class="flex items-center gap-3 px-4 py-3 text-sm rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 text-left w-full transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Sign Out
            </button>
          </nav>
        </aside>

        <!-- Main Account Content -->
        <main class="col-span-1 lg:col-span-3">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ProfileLayoutComponent {
  readonly authStore = inject(AuthStore);
}
