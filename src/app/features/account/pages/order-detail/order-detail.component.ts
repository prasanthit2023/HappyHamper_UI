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
    <div class="card p-6 space-y-8 page-enter">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <a routerLink="/account/orders" class="text-xs text-primary-500 font-bold hover:underline mb-1 inline-block">&larr; Back to orders</a>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">
            Order Details: #{{ order()?.orderNumber }}
          </h2>
          <p class="text-xs text-neutral-400 mt-0.5">Placed on: {{ order()?.createdAt | date:'medium' }}</p>
        </div>

        <div class="flex items-center gap-2">
          @if (order()?.invoiceUrl) {
            <a [href]="order()?.invoiceUrl" target="_blank" class="btn-secondary px-4 py-2 text-xs font-bold">Download Invoice</a>
          }
          <!-- Cancel Order Action (only if placed) -->
          @if (order()?.orderStatus === 'placed') {
            <button (click)="cancelOrder()" [disabled]="actionLoading()" class="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors">
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
        <div class="text-center text-red-500 py-6">
          {{ error() }}
        </div>
      } @else {
        @if (order(); as o) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Left Columns: Items & Address -->
          <div class="md:col-span-2 space-y-6">
            <!-- Items Card -->
            <div class="space-y-3">
              <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Items in Order</h3>
              <div class="divide-y divide-neutral-100 dark:divide-neutral-800 border rounded-2xl p-4 bg-white dark:bg-neutral-800/20">
                @for (item of o.items; track item.variantSku) {
                  <div class="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <img [src]="item.image || '/assets/placeholder-product.jpg'" class="w-16 h-16 object-cover rounded-xl bg-neutral-50 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-bold text-neutral-800 dark:text-neutral-250 truncate">{{ item.title }}</h4>
                      <p class="text-xs text-neutral-400 mt-0.5">SKU: {{ item.variantSku }}</p>
                      @if (item.size || item.color) {
                        <div class="flex gap-2 mt-1">
                          @if (item.size) { <span class="text-[10px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-500">Size: {{ item.size }}</span> }
                          @if (item.color) { <span class="text-[10px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-500">Color: {{ item.color }}</span> }
                        </div>
                      }
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-bold text-neutral-800 dark:text-white block">
                        ₹{{ item.price | number:'1.0-0' }}
                      </span>
                      <span class="text-xs text-neutral-400">Qty: {{ item.quantity }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Shipping Address Details -->
            <div class="space-y-3">
              <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Shipping Address</h3>
              <div class="border rounded-2xl p-4 text-sm bg-white dark:bg-neutral-800/20 leading-relaxed">
                <p class="font-bold text-neutral-800 dark:text-neutral-200">
                  {{ o.shippingAddress.firstName }} {{ o.shippingAddress.lastName }}
                </p>
                <p class="text-xs text-neutral-500 mt-1">
                  {{ o.shippingAddress.street }}, {{ o.shippingAddress.city }}, {{ o.shippingAddress.state }}, {{ o.shippingAddress.country }} - {{ o.shippingAddress.zipCode }}
                </p>
                <p class="text-xs text-neutral-400 mt-2 font-medium">Phone: {{ o.shippingAddress.phone }}</p>
              </div>
            </div>

            <!-- Payment & Summary Details -->
            <div class="space-y-3">
              <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Payment Details</h3>
              <div class="border rounded-2xl p-4 text-sm bg-white dark:bg-neutral-800/20 grid grid-cols-2 gap-4">
                <div>
                  <span class="text-xs text-neutral-400 block mb-0.5">Method</span>
                  <span class="font-bold text-neutral-700 dark:text-neutral-200 uppercase">{{ o.paymentMethod }}</span>
                </div>
                <div>
                  <span class="text-xs text-neutral-400 block mb-0.5">Status</span>
                  <span class="font-bold uppercase" [class.text-green-600]="o.paymentStatus === 'paid'" [class.text-amber-500]="o.paymentStatus === 'pending'">{{ o.paymentStatus }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Timeline & Refund Requests -->
          <div class="space-y-6">
            <!-- Price Summary -->
            <div class="border rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-800/40 text-sm space-y-2">
              <div class="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span class="font-semibold text-neutral-800 dark:text-neutral-250">₹{{ o.subTotal | number:'1.0-0' }}</span>
              </div>
              @if (o.discountAmount > 0) {
                <div class="flex justify-between text-primary">
                  <span>Discount</span>
                  <span class="font-semibold">-₹{{ o.discountAmount | number:'1.0-0' }}</span>
                </div>
              }
              <div class="flex justify-between text-neutral-500">
                <span>Shipping</span>
                <span>₹{{ o.shippingFee | number:'1.0-0' }}</span>
              </div>
              <div class="border-t pt-2 flex justify-between items-baseline font-bold">
                <span>Total Paid</span>
                <span class="text-base text-primary-600">₹{{ o.totalAmount | number:'1.0-0' }}</span>
              </div>
            </div>

            <!-- Status Timeline Tracker -->
            <div class="space-y-3">
              <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Tracking Timeline</h3>
              <div class="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-700">
                @for (hist of o.statusHistory; track hist.timestamp) {
                  <div class="relative">
                    <div class="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-primary-500 ring-2 ring-primary-100"></div>
                    <div>
                      <span class="text-xs font-bold text-neutral-800 dark:text-white capitalize block">{{ hist.status }}</span>
                      <span class="text-[10px] text-neutral-400 block">{{ hist.timestamp | date:'medium' }}</span>
                      @if (hist.note) {
                        <p class="text-xs text-neutral-500 mt-1 italic">"{{ hist.note }}"</p>
                      }
                    </div>
                  </div>
                }
                <!-- Placed default fallback -->
                <div class="relative">
                  <div class="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-primary-300 ring-2 ring-primary-100"></div>
                  <div>
                    <span class="text-xs font-bold text-neutral-500 block">Order Placed</span>
                    <span class="text-[10px] text-neutral-400 block">{{ o.createdAt | date:'medium' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Return request triggering (if delivered) -->
            @if (o.orderStatus === 'delivered' && !returnRequested()) {
              <div class="card p-4 space-y-3 border-amber-200 bg-amber-50/20">
                <h4 class="font-bold text-xs uppercase tracking-wider text-amber-700">Request Return / Refund</h4>
                <p class="text-xs text-neutral-500 leading-relaxed">Delivered items can be returned within 7 days of arrival.</p>
                <form [formGroup]="returnForm" (ngSubmit)="submitReturnRequest()" class="space-y-2">
                  <input type="text" formControlName="reason" placeholder="Reason for return (size, damage, etc.)" class="input-field py-1.5 text-xs" />
                  <button type="submit" [disabled]="returnForm.invalid || actionLoading()" class="btn-primary w-full py-2 text-xs">Submit Return</button>
                </form>
              </div>
            } @else if (returnRequested()) {
              <div class="bg-primary-50 dark:bg-primary-950/20 text-primary-800 dark:text-primary-300 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <i class="pi pi-check-circle"></i> Return Request Submitted. We are reviewing your case.
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

  fetchOrderDetails(id: string) {
    this.loading.set(true);
    this.error.set(null);
    this.cdr.markForCheck();

    this.http.get<any>(`${environment.apiUrl}/orders/${id}`).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.loading.set(false);
        this.checkIfReturnRequested(res.data?._id || res.data?.id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to fetch order details.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  checkIfReturnRequested(orderId: string) {
    // Call returns API to check if a return exists
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
