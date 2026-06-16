import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
    <div class="card p-6 space-y-6 page-enter">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">My Orders</h2>
          <p class="text-neutral-500 text-xs mt-1">Review the history of your placed purchases</p>
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-16 w-full rounded-2xl"></div>
          <div class="skeleton h-16 w-full rounded-2xl"></div>
          <div class="skeleton h-16 w-full rounded-2xl"></div>
        </div>
      } @else if (orders().length === 0) {
        <div class="text-center py-12 text-neutral-400 space-y-3">
          <div class="w-12 h-12 bg-neutral-50 dark:bg-neutral-800 text-neutral-300 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h4 class="font-bold text-sm text-neutral-750">No orders placed</h4>
          <p class="text-xs max-w-xs mx-auto">You haven't bought anything yet. Explore our fresh collections!</p>
          <a routerLink="/products" class="btn-primary py-2.5 px-6 text-xs inline-block mt-2">Shop Clothes</a>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <th class="py-3 px-4">Order Info</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Total Price</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-200">
              @for (order of orders(); track order.id || order._id) {
                <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td class="py-4 px-4 font-semibold">
                    <span class="font-mono text-neutral-800 dark:text-white block font-bold">#{{ order.orderNumber }}</span>
                    <span class="text-[10px] text-neutral-400 font-normal">{{ order.items?.length || 0 }} items in package</span>
                  </td>
                  <td class="py-4 px-4 text-xs text-neutral-500">
                    {{ order.createdAt | date:'mediumDate' }}
                  </td>
                  <td class="py-4 px-4">
                    <span
                      [class.bg-indigo-50]="order.orderStatus === 'placed'"
                      [class.text-indigo-700]="order.orderStatus === 'placed'"
                      [class.bg-amber-50]="['confirmed', 'processing'].includes(order.orderStatus)"
                      [class.text-amber-700]="['confirmed', 'processing'].includes(order.orderStatus)"
                      [class.bg-indigo-50]="order.orderStatus === 'shipped'"
                      [class.text-indigo-700]="order.orderStatus === 'shipped'"
                      [class.bg-primary-50]="order.orderStatus === 'delivered'"
                      [class.text-primary-700]="order.orderStatus === 'delivered'"
                      [class.bg-red-50]="order.orderStatus === 'cancelled'"
                      [class.text-red-700]="order.orderStatus === 'cancelled'"
                      class="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                    >
                      {{ order.orderStatus }}
                    </span>
                  </td>
                  <td class="py-4 px-4 font-bold text-neutral-900 dark:text-white">
                    ₹{{ order.totalAmount | number:'1.0-0' }}
                  </td>
                  <td class="py-4 px-4 text-right">
                    <a [routerLink]="['/account/orders', order._id || order.id]" class="btn-secondary px-3 py-1.5 text-xs font-bold">
                      View Details
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
export class OrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  orders = signal<any[]>([]);
  loading = signal<boolean>(true);

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
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
