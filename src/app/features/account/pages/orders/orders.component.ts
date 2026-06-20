import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-orders-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="card p-6 space-y-6 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm page-enter animate-fade-in">
      <div class="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 class="font-bold text-xl text-[var(--color-text)] font-display">My Orders</h2>
          <p class="text-[var(--color-text-muted)] text-xs mt-0.5">Review the history of your placed purchases</p>
        </div>
      </div>

      <!-- Tabs Selector -->
      <div class="flex border-b border-[var(--color-border)] overflow-x-auto scrollbar-hide gap-1 pb-px">
        <button
          (click)="activeTab.set('all')"
          class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap focus:outline-none"
          [class]="activeTab() === 'all' ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-extrabold' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'"
        >
          All Orders
        </button>
        <button
          (click)="activeTab.set('progress')"
          class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap focus:outline-none"
          [class]="activeTab() === 'progress' ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-extrabold' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'"
        >
          In Progress
        </button>
        <button
          (click)="activeTab.set('delivered')"
          class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap focus:outline-none"
          [class]="activeTab() === 'delivered' ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-extrabold' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'"
        >
          Delivered
        </button>
        <button
          (click)="activeTab.set('cancelled')"
          class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap focus:outline-none"
          [class]="activeTab() === 'cancelled' ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-extrabold' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'"
        >
          Cancelled
        </button>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-24 w-full rounded-2xl"></div>
          <div class="skeleton h-24 w-full rounded-2xl"></div>
          <div class="skeleton h-24 w-full rounded-2xl"></div>
        </div>
      } @else if (filteredOrders().length === 0) {
        <div class="text-center py-12 text-[var(--color-text-muted)] space-y-3">
          <div class="w-12 h-12 bg-[var(--color-accent-light)] text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto shadow-sm">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h4 class="font-bold text-sm text-[var(--color-text)]">No orders found</h4>
          <p class="text-xs max-w-xs mx-auto">We couldn't find any orders in this category. Let's find some cute outfits!</p>
          <a routerLink="/products" class="btn-primary py-2.5 px-6 text-xs inline-block mt-2">Shop Clothes</a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (order of filteredOrders(); track (order.id || order._id)) {
            <div class="border border-[var(--color-border)] rounded-2xl bg-white p-5 hover:shadow-md transition-all space-y-4">
              <!-- Top bar: info -->
              <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-[var(--color-border)] pb-3 text-xs">
                <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div>
                    <span class="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Order Placed</span>
                    <span class="font-bold text-[var(--color-text)]">{{ order.createdAt | date:'mediumDate' }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Total Amount</span>
                    <span class="font-bold text-[var(--color-text)]">₹{{ order.totalAmount | number:'1.0-0' }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">Order ID</span>
                    <span class="font-bold text-[var(--color-primary)] font-mono">{{ order.orderNumber }}</span>
                  </div>
                </div>
                
                <div class="self-start sm:self-auto">
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
              </div>

              <!-- Mid: Item thumbnails & info -->
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="flex items-center gap-2 flex-wrap">
                  @for (item of $any(order).items | slice:0:3; track $any(item).variantSku) {
                    <img
                      [src]="$any(item).image || '/assets/placeholder-product.jpg'"
                      [alt]="$any(item).title"
                      class="w-12 h-12 object-cover rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)]"
                    />
                  }
                  @if ($any(order).items?.length > 3) {
                    <div class="w-12 h-12 rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] font-bold text-xs">
                      +{{ $any(order).items.length - 3 }}
                    </div>
                  }
                  <div class="ml-2">
                    <p class="text-xs font-bold text-[var(--color-text)] max-w-[200px] truncate sm:max-w-xs">{{ $any(order).items?.[0]?.title || 'Package Items' }}</p>
                    <p class="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-semibold">
                      @if ($any(order).items?.length > 1) {
                        and {{ $any(order).items.length - 1 }} other {{ $any(order).items.length - 1 === 1 ? 'item' : 'items' }}
                      } @else {
                        Single Item Package
                      }
                    </p>
                  </div>
                </div>

                <div class="w-full sm:w-auto">
                  <a [routerLink]="['/account/orders', order._id || order.id]" class="btn-secondary w-full sm:w-auto px-4 py-2 text-xs font-bold text-center">
                    View Details
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class OrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  orders = signal<any[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<string>('all');

  filteredOrders = computed(() => {
    const list = this.orders();
    const tab = this.activeTab();
    if (tab === 'progress') {
      return list.filter(o => ['placed', 'confirmed', 'processing', 'shipped'].includes(o.orderStatus));
    } else if (tab === 'delivered') {
      return list.filter(o => o.orderStatus === 'delivered');
    } else if (tab === 'cancelled') {
      return list.filter(o => o.orderStatus === 'cancelled');
    }
    return list;
  });

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/orders`).subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.orders.set([]);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
