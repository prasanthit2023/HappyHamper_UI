import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthStore } from '../../../../state/auth.store';
import { WishlistStore } from '../../../../state/wishlist.store';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-account-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6 page-enter animate-fade-in">
      <!-- Welcome Header -->
      <div>
        <h1 class="text-2xl font-extrabold text-[var(--color-text)] font-display">
          Hello, {{ authStore.user()?.firstName }}!
        </h1>
        <p class="text-[var(--color-text-muted)] text-sm mt-0.5">Welcome to your dashboard. Access orders, profile settings, and shipping addresses here.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card p-5 space-y-2 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm">
          <span class="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Total Orders</span>
          <div class="flex items-baseline justify-between">
            <span class="text-3xl font-black text-[var(--color-text)]">{{ orderCount() }}</span>
            <a routerLink="/account/orders" class="text-xs text-[var(--color-primary)] hover:underline font-bold">View All</a>
          </div>
        </div>

        <div class="card p-5 space-y-2 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm">
          <span class="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Wishlist Items</span>
          <div class="flex items-baseline justify-between">
            <span class="text-3xl font-black text-[var(--color-text)]">{{ wishlistStore.count() }}</span>
            <a routerLink="/account/wishlist" class="text-xs text-[var(--color-primary)] hover:underline font-bold">View Wishlist</a>
          </div>
        </div>

        <div class="card p-5 space-y-2 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm">
          <span class="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Saved Addresses</span>
          <div class="flex items-baseline justify-between">
            <span class="text-3xl font-black text-[var(--color-text)]">{{ authStore.user()?.addresses?.length || 0 }}</span>
            <a routerLink="/account/addresses" class="text-xs text-[var(--color-primary)] hover:underline font-bold">Manage</a>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Profile Summary Column -->
        <div class="md:col-span-1 card p-5 space-y-4 h-fit bg-white border border-[var(--color-border)] rounded-2xl shadow-sm">
          <h3 class="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider border-b border-[var(--color-border)] pb-2">Profile Overview</h3>
          <div class="space-y-3 text-sm">
            <div>
              <span class="text-xs text-[var(--color-text-muted)] block">Name</span>
              <span class="font-semibold text-[var(--color-text)]">{{ authStore.fullName() }}</span>
            </div>
            <div>
              <span class="text-xs text-[var(--color-text-muted)] block">Phone</span>
              <span class="font-semibold text-[var(--color-text)]">{{ authStore.user()?.phone }}</span>
            </div>
            <div>
              <span class="text-xs text-[var(--color-text-muted)] block">Verified Status</span>
              @if (authStore.user()?.isVerified) {
                <span class="text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <svg class="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                  Mobile Verified
                </span>
              } @else {
                <span class="text-[var(--color-error)] font-bold flex items-center gap-1 mt-0.5">
                  <svg class="w-4 h-4 text-[var(--color-error)]" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                  Unverified
                </span>
              }
            </div>
          </div>
          <a routerLink="/account/profile" class="btn-secondary w-full py-2.5 text-xs text-center font-bold">Edit Profile Info</a>
        </div>

        <!-- Recent Orders Column -->
        <div class="md:col-span-2 card p-5 space-y-4 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm">
          <h3 class="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider border-b border-[var(--color-border)] pb-2">Recent Orders</h3>

          @if (loadingOrders()) {
            <div class="space-y-3">
              <div class="skeleton h-12 w-full rounded-xl"></div>
              <div class="skeleton h-12 w-full rounded-xl"></div>
            </div>
          } @else if (recentOrders().length === 0) {
            <div class="text-center py-8 text-[var(--color-text-muted)] text-sm">
              You haven't placed any orders yet.
            </div>
          } @else {
            <div class="divide-y divide-[var(--color-border)]">
              @for (order of recentOrders(); track (order._id || order.id)) {
                <div class="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                  <div>
                    <span class="font-mono font-bold text-[var(--color-text)]">#{{ order.orderNumber }}</span>
                    <span class="text-xs text-[var(--color-text-muted)] block mt-0.5">Placed: {{ order.createdAt | date:'mediumDate' }}</span>
                  </div>
                  <div>
                    <span class="font-bold text-[var(--color-text)] block">₹{{ order.totalAmount | number:'1.0-0' }}</span>
                    <span class="text-xs text-[var(--color-text-muted)] block mt-0.5">{{ order.items?.length || 0 }} {{ order.items?.length === 1 ? 'item' : 'items' }}</span>
                  </div>
                  <div>
                    <span
                      [class.bg-[var(--color-primary-light)]]="order.orderStatus === 'placed'"
                      [class.text-[var(--color-primary)]]="order.orderStatus === 'placed'"
                      [class.bg-[var(--color-accent-light)]]="['confirmed', 'processing', 'shipped'].includes(order.orderStatus)"
                      [class.text-[var(--color-accent)]]="['confirmed', 'processing', 'shipped'].includes(order.orderStatus)"
                      [class.bg-green-50]="order.orderStatus === 'delivered'"
                      [class.text-green-700]="order.orderStatus === 'delivered'"
                      [class.bg-red-50]="order.orderStatus === 'cancelled'"
                      [class.text-red-700]="order.orderStatus === 'cancelled'"
                      class="px-2.5 py-1 rounded-full text-xs font-bold capitalize inline-block"
                    >
                      {{ order.orderStatus }}
                    </span>
                  </div>
                  <a [routerLink]="['/account/orders', order._id || order.id]" class="text-xs text-[var(--color-primary)] font-bold hover:underline">Details &rarr;</a>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AccountDashboardComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly wishlistStore = inject(WishlistStore);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  recentOrders = signal<any[]>([]);
  orderCount = signal<number>(0);
  loadingOrders = signal<boolean>(true);

  ngOnInit() {
    this.fetchDashboardInfo();
  }

  fetchDashboardInfo() {
    this.loadingOrders.set(true);
    this.http.get<any>(`${environment.apiUrl}/orders?limit=3`).subscribe({
      next: (res) => {
        this.recentOrders.set(res.data || []);
        this.orderCount.set(res.pagination?.total || res.data.length || 0);
        this.loadingOrders.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.recentOrders.set([]);
        this.orderCount.set(0);
        this.loadingOrders.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
