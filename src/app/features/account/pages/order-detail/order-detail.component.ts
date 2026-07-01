import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="card p-6 space-y-6 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm page-enter animate-fade-in">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <a routerLink="/account/orders" class="text-xs text-[var(--color-primary)] font-bold hover:underline mb-1 inline-block">&larr; Back to orders</a>
          <h2 class="font-bold text-xl text-[var(--color-text)] font-display">
            Order Details: #{{ order()?.orderNumber }}
          </h2>
          <p class="text-xs text-[var(--color-text-muted)] mt-0.5">Placed on: {{ order()?.createdAt | date:'medium' }}</p>
        </div>

        <div class="flex items-center gap-2">
          @if (order()?.invoiceUrl) {
            <a [href]="order()?.invoiceUrl" target="_blank" class="btn-secondary px-4 py-2 text-xs font-bold">Download Invoice</a>
          }
          <!-- Cancel Order Action (only if placed) -->
          @if (order()?.orderStatus === 'placed') {
            <button (click)="cancelOrder()" [disabled]="actionLoading()" class="bg-red-50 text-red-650 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
              Cancel Order
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-20 w-full rounded-2xl"></div>
          <div class="skeleton h-40 w-full rounded-2xl"></div>
        </div>
      } @else if (error()) {
        <div class="text-center text-[var(--color-error)] py-6 font-bold">
          {{ error() }}
        </div>
      } @else {
        @if (order(); as o) {
        
        <!-- Horizontal Status Tracker -->
        @if (o.orderStatus !== 'cancelled') {
          <div class="bg-[var(--color-bg-subtle)] border border-[var(--color-border)] p-6 rounded-2xl">
            <div class="flex items-center justify-between relative max-w-lg mx-auto">
              <!-- Background line -->
              <div class="absolute left-0 right-0 top-5 -translate-y-1/2 h-0.5 bg-[var(--color-border)] z-0 rounded"></div>
              <!-- Active progress line -->
              <div class="absolute left-0 top-5 -translate-y-1/2 h-0.5 z-0 rounded transition-all duration-300"
                   [style.width]="o.orderStatus === 'placed' ? '0%' : o.orderStatus === 'shipped' ? '66%' : ['confirmed', 'processing'].includes(o.orderStatus) ? '33%' : '100%'"
                   [style.background]="'var(--gradient-primary)'">
              </div>

              <!-- Step 1: Placed -->
              <div class="flex flex-col items-center relative z-10">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-all duration-300 text-white"
                     [style.background]="'var(--gradient-primary)'">
                  ✓
                </div>
                <span class="text-[10px] font-bold mt-2 text-center text-[var(--color-primary)]">Placed</span>
              </div>

              <!-- Step 2: Confirmed -->
              <div class="flex flex-col items-center relative z-10">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-all duration-300
                  {{ getStatusStep(o.orderStatus) >= 2 ? 'text-white' : 'bg-white border-2 border-[var(--color-border)] text-[var(--color-text-muted)]' }}"
                  [style]="getStatusStep(o.orderStatus) >= 2 ? 'background: var(--gradient-primary)' : ''">
                  @if (getStatusStep(o.orderStatus) > 2) { ✓ } @else { 2 }
                </div>
                <span class="text-[10px] font-bold mt-2 text-center {{ getStatusStep(o.orderStatus) >= 2 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]' }}">Confirmed</span>
              </div>

              <!-- Step 3: Shipped -->
              <div class="flex flex-col items-center relative z-10">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-all duration-300
                  {{ getStatusStep(o.orderStatus) >= 3 ? 'text-white' : 'bg-white border-2 border-[var(--color-border)] text-[var(--color-text-muted)]' }}"
                  [style]="getStatusStep(o.orderStatus) >= 3 ? 'background: var(--gradient-primary)' : ''">
                  @if (getStatusStep(o.orderStatus) > 3) { ✓ } @else { 3 }
                </div>
                <span class="text-[10px] font-bold mt-2 text-center {{ getStatusStep(o.orderStatus) >= 3 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]' }}">Shipped</span>
              </div>

              <!-- Step 4: Delivered -->
              <div class="flex flex-col items-center relative z-10">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-all duration-300
                  {{ getStatusStep(o.orderStatus) >= 4 ? 'text-white' : 'bg-white border-2 border-[var(--color-border)] text-[var(--color-text-muted)]' }}"
                  [style]="getStatusStep(o.orderStatus) >= 4 ? 'background: var(--gradient-primary)' : ''">
                  4
                </div>
                <span class="text-[10px] font-bold mt-2 text-center {{ getStatusStep(o.orderStatus) >= 4 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]' }}">Delivered</span>
              </div>
            </div>
          </div>
        } @else {
          <!-- Cancelled Banner -->
          <div class="bg-red-50 border border-red-200 text-[var(--color-error)] p-4 rounded-2xl text-center font-bold flex items-center justify-center gap-2">
             ⚠️ This order has been Cancelled.
          </div>
        }

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Left Columns: Items & Address -->
          <div class="md:col-span-2 space-y-6">
            <!-- Items Card -->
            <div class="space-y-3">
              <h3 class="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider">Items in Order</h3>
              <div class="divide-y divide-[var(--color-border)] border border-[var(--color-border)] rounded-2xl p-4 bg-white">
                @for (item of o.items; track item.variantSku) {
                  <div class="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <img [src]="item.image || '/assets/placeholder-product.jpg'" class="w-16 h-16 object-cover rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-bold text-[var(--color-text)] truncate">{{ item.title }}</h4>
                      <p class="text-xs text-[var(--color-text-muted)] mt-0.5 font-medium">SKU: {{ item.variantSku }}</p>
                      @if (item.size || item.color) {
                        <div class="flex gap-2 mt-1.5">
                          @if (item.size) { <span class="text-[10px] bg-[var(--color-accent-light)] border border-[var(--color-border)] px-2 py-0.5 rounded text-[var(--color-text-muted)] font-semibold">Size: {{ item.size }}</span> }
                          @if (item.color) { <span class="text-[10px] bg-[var(--color-accent-light)] border border-[var(--color-border)] px-2 py-0.5 rounded text-[var(--color-text-muted)] font-semibold">Color: {{ item.color }}</span> }
                        </div>
                      }
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-bold text-[var(--color-text)] block">
                        <i class="bi bi-currency-rupee"></i>{{ item.price | number:'1.0-0' }}
                      </span>
                      <span class="text-xs text-[var(--color-text-muted)] font-medium">Qty: {{ item.quantity }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Shipping Address Details -->
            <div class="space-y-3">
              <h3 class="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider">Shipping Address</h3>
              <div class="border border-[var(--color-border)] rounded-2xl p-4 text-sm bg-white leading-relaxed shadow-sm">
                @if (o.shippingAddress) {
                  <p class="font-bold text-[var(--color-text)]">
                    {{ o.shippingAddress.fullName || (o.shippingAddress.firstName && o.shippingAddress.lastName ? o.shippingAddress.firstName + ' ' + o.shippingAddress.lastName : (o.shippingAddress.firstName || o.shippingAddress.lastName || 'N/A')) }}
                  </p>
                  <p class="text-xs text-[var(--color-text-muted)] mt-1 font-medium">
                    {{ o.shippingAddress.street }}, {{ o.shippingAddress.city }}, {{ o.shippingAddress.state }}, {{ o.shippingAddress.country }} - {{ o.shippingAddress.zipCode }}
                  </p>
                  <p class="text-xs text-[var(--color-text-muted)] mt-2 font-bold flex items-center gap-1">
                    <span>📞</span> {{ o.shippingAddress.phone }}
                  </p>
                } @else {
                  <p class="text-xs text-[var(--color-text-muted)] italic">Address details not available</p>
                }
              </div>
            </div>

            <!-- Payment & Summary Details -->
            <div class="space-y-3">
              <h3 class="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider">Payment Details</h3>
              <div class="border border-[var(--color-border)] rounded-2xl p-4 text-sm bg-white grid grid-cols-2 gap-4 shadow-sm">
                <div>
                  <span class="text-xs text-[var(--color-text-muted)] block mb-0.5">Method</span>
                  <span class="font-bold text-[var(--color-text)] uppercase">{{ o.paymentMethod }}</span>
                </div>
                <div>
                  <span class="text-xs text-[var(--color-text-muted)] block mb-0.5">Status</span>
                  <span class="font-bold uppercase inline-flex items-center gap-1" [class.text-green-600]="o.paymentStatus === 'paid'" [class.text-amber-500]="o.paymentStatus === 'pending'">
                    <span class="w-1.5 h-1.5 rounded-full" [class.bg-green-600]="o.paymentStatus === 'paid'" [class.bg-amber-50]="o.paymentStatus === 'pending'"></span>
                    {{ o.paymentStatus }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Timeline & Refund Requests -->
          <div class="space-y-6">
            <!-- Price Summary -->
            <div class="border border-[var(--color-border)] rounded-2xl p-4 bg-[var(--color-bg-subtle)] text-sm space-y-2.5">
              <div class="flex justify-between text-[var(--color-text-muted)]">
                <span>Subtotal</span>
                <span class="font-semibold text-[var(--color-text)]"><i class="bi bi-currency-rupee"></i>{{ o.subTotal | number:'1.0-0' }}</span>
              </div>
              @if (o.discountAmount > 0) {
                <div class="flex justify-between text-[var(--color-primary)] font-semibold">
                  <span>Discount</span>
                  <span>-<i class="bi bi-currency-rupee"></i>{{ o.discountAmount | number:'1.0-0' }}</span>
                </div>
              }
              <div class="flex justify-between text-[var(--color-text-muted)]">
                <span>Shipping</span>
                <span class="font-semibold text-[var(--color-text)]"><i class="bi bi-currency-rupee"></i>{{ o.shippingFee | number:'1.0-0' }}</span>
              </div>
              <div class="border-t border-[var(--color-border)] pt-2.5 flex justify-between items-baseline font-bold">
                <span>Total Paid</span>
                <span class="text-base text-[var(--color-primary)]"><i class="bi bi-currency-rupee"></i>{{ o.totalAmount | number:'1.0-0' }}</span>
              </div>
            </div>

            <!-- Status Timeline Tracker -->
            <div class="space-y-3">
              <h3 class="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider">Tracking Timeline</h3>
              <div class="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border)]">
                @for (hist of o.statusHistory; track hist.timestamp) {
                  <div class="relative">
                    <div class="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)]"></div>
                    <div>
                      <span class="text-xs font-bold text-[var(--color-text)] capitalize block">{{ hist.status }}</span>
                      <span class="text-[10px] text-[var(--color-text-muted)] block">{{ hist.timestamp | date:'medium' }}</span>
                      @if (hist.note) {
                        <p class="text-xs text-[var(--color-text-muted)] mt-1.5 italic bg-[var(--color-bg-subtle)] px-2 py-1 rounded border border-[var(--color-border)] inline-block">"{{ hist.note }}"</p>
                      }
                    </div>
                  </div>
                }
                <!-- Placed default fallback -->
                <div class="relative">
                  <div class="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-[var(--color-accent)] ring-2 ring-[var(--color-accent-light)]"></div>
                  <div>
                    <span class="text-xs font-bold text-[var(--color-text-muted)] block">Order Placed</span>
                    <span class="text-[10px] text-[var(--color-text-muted)] block">{{ o.createdAt | date:'medium' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Return request triggering (if delivered) -->
            @if (o.orderStatus === 'delivered' && !returnRequested()) {
              <div class="card p-4 space-y-3 border-amber-200 bg-amber-50/20 rounded-2xl">
                <h4 class="font-bold text-xs uppercase tracking-wider text-amber-700">Request Return / Refund</h4>
                <p class="text-xs text-[var(--color-text-muted)] leading-relaxed">Delivered items can be returned within 7 days of arrival.</p>
                <form [formGroup]="returnForm" (ngSubmit)="submitReturnRequest()" class="space-y-2">
                  <input type="text" formControlName="reason" placeholder="Reason for return (size, damage, etc.)" class="input-field py-1.5 text-xs focus:ring-2 focus:ring-[var(--color-primary)]" />
                  <button type="submit" [disabled]="returnForm.invalid || actionLoading()" class="btn-primary w-full py-2 text-xs">Submit Return</button>
                </form>
              </div>
            } @else if (returnRequested()) {
              <div class="bg-[var(--color-primary-light)] text-[var(--color-primary)] p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Return Request Submitted. We are reviewing your case.
              </div>
            }
          </div>
        </div>
        }
      }
    </div>
  `,
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  private routeSub!: Subscription;

  order = signal<any | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  actionLoading = signal<boolean>(false);
  returnRequested = signal<boolean>(false);

  returnForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit() {
    this.routeSub = this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.fetchOrderDetails(id);
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  getStatusStep(status: string): number {
    switch (status) {
      case 'placed': return 1;
      case 'confirmed':
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 1;
    }
  }

  fetchOrderDetails(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.cdr.markForCheck();

    this.http.get<any>(`${environment.apiUrl}/orders/${id}`).subscribe({
      next: (res) => {
        const orderData = res.data;
        if (orderData && !orderData.statusHistory) {
          orderData.statusHistory = this.generateStatusHistory(orderData);
        }
        this.order.set(orderData);
        this.loading.set(false);
        this.checkIfReturnRequested(orderData?._id || orderData?.id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch order details.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  generateStatusHistory(order: any): any[] {
    const history: any[] = [];
    const status = (order.orderStatus || '').toLowerCase();
    const created = new Date(order.createdAt).getTime();
    const updated = new Date(order.updatedAt || order.createdAt).getTime();

    // 1. Cancelled Status
    if (status === 'cancelled') {
      history.push({
        status: 'Cancelled',
        timestamp: updated,
        note: order.notes || 'Order cancelled.'
      });
    }

    // 2. Delivered Status
    if (['delivered'].includes(status)) {
      history.push({
        status: 'Delivered',
        timestamp: updated,
        note: 'Package delivered successfully.'
      });
    }

    // 3. Shipped Status
    if (['shipped', 'delivered'].includes(status)) {
      const shippedTime = status === 'delivered' ? (created + updated) / 2 : updated;
      history.push({
        status: 'Shipped',
        timestamp: shippedTime,
        note: order.trackingNumber ? `Shipped via courier. Tracking ID: ${order.trackingNumber}` : 'Package shipped.'
      });
    }

    // 4. Confirmed Status (Processing / Confirmed)
    if (['confirmed', 'processing', 'shipped', 'delivered'].includes(status)) {
      const confirmedTime = ['confirmed', 'processing'].includes(status) ? updated : (created + 1000 * 60 * 30); // +30 mins
      history.push({
        status: 'Confirmed',
        timestamp: confirmedTime,
        note: 'Order confirmed and being prepared.'
      });
    }

    return history;
  }

  checkIfReturnRequested(orderId: string) {
    this.http.get<any>(`${environment.apiUrl}/returns/my`).subscribe({
      next: (res) => {
        const list = res.data || [];
        const exists = list.some((r: any) => r.orderId === orderId);
        this.returnRequested.set(exists);
        this.cdr.markForCheck();
      },
    });
  }

  cancelOrder() {
    const o = this.order();
    if (!o) return;

    this.actionLoading.set(true);
    this.http.patch<any>(`${environment.apiUrl}/orders/${o._id || o.id}/cancel`, {}).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.fetchOrderDetails(o._id || o.id);
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  submitReturnRequest() {
    if (this.returnForm.invalid) return;
    const o = this.order();
    if (!o) return;

    this.actionLoading.set(true);
    const payload = {
      orderId: o._id || o.id,
      items: o.items.map((i: any) => ({ variantSku: i.variantSku, quantity: i.quantity })),
      reason: this.returnForm.value.reason,
    };

    this.http.post<any>(`${environment.apiUrl}/returns`, payload).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.returnRequested.set(true);
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
