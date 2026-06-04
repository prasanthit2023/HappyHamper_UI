import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-16 w-full rounded-2xl"></div>
          <div class="skeleton h-16 w-full rounded-2xl"></div>
        </div>
      } @else if (orders().length === 0) {
        <div class="text-center py-12 text-neutral-400">
          No orders found.
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
              @for (order of orders(); track order._id) {
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
                        (ngModelChange)="updateStatus(order._id, $event)"
                        class="px-2 py-1 border rounded-lg text-xs bg-white dark:bg-neutral-800 dark:text-neutral-250 focus:outline-none"
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
                    <a [routerLink]="['/account/orders', order._id || order.id]" class="text-xs text-primary-500 font-semibold hover:underline">
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

  updateStatus(id: string, newStatus: string) {
    const payload = {
      status: newStatus,
      note: 'Status updated by administrator',
    };

    this.http.put<any>(`${environment.apiUrl}/orders/admin/${id}/status`, payload).subscribe({
      next: () => {
        this.orders.update((list) =>
          list.map((o) => (o._id === id ? { ...o, orderStatus: newStatus } : o))
        );
        this.cdr.markForCheck();
      },
    });
  }
}
