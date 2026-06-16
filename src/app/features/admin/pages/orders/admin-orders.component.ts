import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="card p-6 space-y-6 page-enter">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">Orders Processing</h2>
          <p class="text-neutral-500 text-xs mt-1">Review customer sales, update tracking, and update progress</p>
        </div>
      </div>

      <!-- Search and Status tabs bar -->
      <div class="space-y-4">
        <!-- Search bar -->
        <div class="relative max-w-md">
          <input
            type="text"
            placeholder="Search by order number, customer name, phone..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            class="input-field py-2.5 pl-9 text-xs"
          />
          <svg class="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>

        <!-- Status Tabs -->
        <div class="flex flex-wrap gap-2 border-b pb-1 border-neutral-100 dark:border-neutral-800">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer focus:outline-none flex items-center gap-1.5"
              [style.border-color]="activeTab() === tab.id ? 'var(--color-primary)' : 'transparent'"
              [style.color]="activeTab() === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'"
            >
              {{ tab.label }}
              <span 
                class="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                [style.background]="activeTab() === tab.id ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'"
                [style.color]="activeTab() === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              >
                {{ getTabCount(tab.id) }}
              </span>
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-16 w-full rounded-2xl"></div>
          <div class="skeleton h-16 w-full rounded-2xl"></div>
        </div>
      } @else if (orders().length === 0) {
        <div class="text-center py-12 text-neutral-400">
          No orders found.
        </div>
      } @else if (filteredOrders().length === 0) {
        <div class="text-center py-12 text-neutral-400 text-sm">
          No orders match your filter criteria or search.
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <th class="py-3 px-4">Order info</th>
                <th class="py-3 px-4">Customer</th>
                <th class="py-3 px-4">Total</th>
                <th class="py-3 px-4">Payment</th>
                <th class="py-3 px-4">Status & Transition</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-200">
              @for (order of filteredOrders(); track order.id || order._id) {
                <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td class="py-3 px-4">
                    <span class="font-mono font-bold text-neutral-800 dark:text-white">#{{ order.orderNumber }}</span>
                    <span class="text-[10px] text-neutral-400 block">{{ order.createdAt | date:'mediumDate' }}</span>
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-semibold block text-neutral-800 dark:text-neutral-200">
                      {{ order.shippingAddress?.firstName }} {{ order.shippingAddress?.lastName }}
                    </span>
                    <span class="text-xs text-neutral-400 block">{{ order.shippingAddress?.phone }}</span>
                  </td>
                  <td class="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                    ₹{{ order.totalAmount | number:'1.0-0' }}
                  </td>
                  <td class="py-3 px-4">
                    <span
                      [class.bg-green-50]="order.paymentStatus === 'paid'"
                      [class.text-green-700]="order.paymentStatus === 'paid'"
                      [class.bg-amber-50]="order.paymentStatus === 'pending'"
                      [class.text-amber-700]="order.paymentStatus === 'pending'"
                      [class.bg-red-50]="order.paymentStatus === 'failed'"
                      [class.text-red-700]="order.paymentStatus === 'failed'"
                      class="px-2 py-0.5 rounded text-xs font-semibold capitalize"
                    >
                      {{ order.paymentStatus }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                      <select
                        [ngModel]="order.orderStatus"
                        (ngModelChange)="updateStatus(order.id || order._id, $event)"
                        class="px-2 py-1 border rounded-lg text-xs bg-white dark:bg-neutral-800 dark:text-neutral-250 focus:outline-none cursor-pointer"
                      >
                        <option value="placed">Placed</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <a [routerLink]="['/account/orders', order.id || order._id]" class="text-xs text-primary-500 font-semibold hover:underline">
                      Review Items
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  orders = signal<any[]>([]);
  loading = signal<boolean>(true);

  // Filters signals
  searchTerm = signal<string>('');
  activeTab = signal<string>('all');

  tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending / Confirmed' },
    { id: 'processing', label: 'Processing' },
    { id: 'transit', label: 'In Transit' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  filteredOrders = computed(() => {
    let list = this.orders();
    const tab = this.activeTab();
    const search = this.searchTerm().toLowerCase().trim();

    // 1. Tab filter
    if (tab !== 'all') {
      if (tab === 'pending') {
        list = list.filter((o) => o.orderStatus === 'placed' || o.orderStatus === 'confirmed');
      } else if (tab === 'processing') {
        list = list.filter((o) => o.orderStatus === 'processing');
      } else if (tab === 'transit') {
        list = list.filter((o) => o.orderStatus === 'shipped' || o.orderStatus === 'out_for_delivery');
      } else if (tab === 'delivered') {
        list = list.filter((o) => o.orderStatus === 'delivered');
      } else if (tab === 'cancelled') {
        list = list.filter((o) => o.orderStatus === 'cancelled');
      }
    }

    // 2. Search filter
    if (search) {
      list = list.filter((o) =>
        o.orderNumber?.toLowerCase().includes(search) ||
        o.shippingAddress?.firstName?.toLowerCase().includes(search) ||
        o.shippingAddress?.lastName?.toLowerCase().includes(search) ||
        o.shippingAddress?.phone?.includes(search)
      );
    }

    return list;
  });

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/orders/admin/all`).subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  getTabCount(tabId: string): number {
    const list = this.orders();
    if (tabId === 'all') return list.length;
    if (tabId === 'pending') {
      return list.filter((o) => o.orderStatus === 'placed' || o.orderStatus === 'confirmed').length;
    }
    if (tabId === 'processing') {
      return list.filter((o) => o.orderStatus === 'processing').length;
    }
    if (tabId === 'transit') {
      return list.filter((o) => o.orderStatus === 'shipped' || o.orderStatus === 'out_for_delivery').length;
    }
    if (tabId === 'delivered') {
      return list.filter((o) => o.orderStatus === 'delivered').length;
    }
    if (tabId === 'cancelled') {
      return list.filter((o) => o.orderStatus === 'cancelled').length;
    }
    return 0;
  }

  updateStatus(id: string, newStatus: string) {
    const payload = {
      status: newStatus,
      note: 'Status updated by administrator',
    };

    this.http.put<any>(`${environment.apiUrl}/orders/admin/${id}/status`, payload).subscribe({
      next: () => {
        this.orders.update((list) =>
          list.map((o) => ((o.id || o._id) === id ? { ...o, orderStatus: newStatus } : o))
        );
        this.cdr.markForCheck();
      },
    });
  }
}
