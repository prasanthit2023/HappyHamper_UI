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
  styles: [`
    .hidden-on-screen {
      display: none !important;
    }
    @media print {
      /* Hide regular web page layouts entirely */
      .no-print, bb-navbar, bb-footer, bb-cart-drawer, bb-toast {
        display: none !important;
      }
      /* Clean page defaults for printing */
      body, html {
        background: #fff !important;
        color: #000 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      /* Expand wrappers to full page */
      .bb-container, main, .page-enter {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      /* Show and format print invoice beautifully */
      .printable-invoice.hidden-on-screen {
        display: block !important;
      }
      .printable-invoice {
        display: block !important;
        width: 100% !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 12px !important;
        padding: 24px !important;
        box-shadow: none !important;
        background: #fff !important;
        color: #000 !important;
      }
    }
  `],
  template: `
    <div class="card p-6 space-y-6 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm page-enter animate-fade-in no-print">
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
          <button (click)="printInvoice()" class="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <i class="pi pi-print"></i> Print Invoice
          </button>
          @if (order()?.invoiceUrl) {
            <a [href]="order()?.invoiceUrl" target="_blank" class="btn-secondary px-4 py-2 text-xs font-bold">Download PDF</a>
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
        @if (o.orderStatus !== 'cancelled' && o.orderStatus !== 'returned') {
          <div class="bg-[var(--color-bg-subtle)] border border-[var(--color-border)] p-6 rounded-2xl">
            <div class="flex items-center justify-between relative max-w-lg mx-auto">
              <!-- Background line -->
              <div class="absolute left-0 right-0 top-5 -translate-y-1/2 h-0.5 bg-[var(--color-border)] z-0 rounded"></div>
              <!-- Active progress line -->
              <div class="absolute left-0 top-5 -translate-y-1/2 h-0.5 z-0 rounded transition-all duration-300"
                   [style.width]="o.orderStatus === 'placed' ? '0%' : ['shipped', 'out_for_delivery'].includes(o.orderStatus) ? '66%' : ['confirmed', 'processing'].includes(o.orderStatus) ? '33%' : '100%'"
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
        } @else if (o.orderStatus === 'cancelled') {
          <!-- Cancelled Banner -->
          <div class="bg-red-50 border border-red-200 text-[var(--color-error)] p-4 rounded-2xl text-center font-bold flex items-center justify-center gap-2">
             ⚠️ This order has been Cancelled.
          </div>
        } @else if (o.orderStatus === 'returned') {
          <!-- Returned Banner -->
          <div class="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-2xl text-center font-bold flex items-center justify-center gap-2">
             ↩️ This order has been Returned.
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
                      <span class="text-xs font-bold text-[var(--color-text)] capitalize block">{{ formatStatus(hist.status) }}</span>
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

    @if (order(); as o) {
      <!-- Dedicated Printable Tax Invoice (hidden on screen, visible on print) -->
      <div class="printable-invoice hidden-on-screen text-left">
        <div class="flex justify-between items-center border-b border-neutral-200 pb-3 mb-4">
          <div>
            <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Order Reference</span>
            <p class="text-sm font-bold text-[var(--color-primary)] font-mono">{{ o.orderNumber }}</p>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Date</span>
            <p class="text-xs font-semibold text-neutral-800">{{ o.createdAt | date:'mediumDate' }}</p>
          </div>
        </div>
        
        <h3 class="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">Items Ordered</h3>
        
        <!-- Items list -->
        <div class="divide-y divide-neutral-100 border-t border-b border-neutral-100 py-2 mb-4">
          @for (item of o.items; track item.variantSku) {
            <div class="flex items-center gap-3 py-3">
              <img
                [src]="item.image || '/assets/placeholder-product.jpg'"
                [alt]="item.title"
                class="w-12 h-12 object-cover rounded-xl bg-neutral-50 border border-neutral-100 flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-neutral-800 truncate">{{ item.title }}</p>
                <p class="text-[10px] text-neutral-400 mt-0.5 font-medium">
                  Qty: {{ item.quantity }} @if (item.size) { &bull; Size: {{ item.size }} } @if (item.color) { &bull; {{ item.color }} }
                </p>
              </div>
              <span class="text-xs font-bold text-neutral-800 whitespace-nowrap"><i class="bi bi-currency-rupee"></i>{{ (item.price * item.quantity) | number:'1.0-0' }}</span>
            </div>
          }
        </div>
        
        <!-- Totals breakdown -->
        <div class="space-y-2 text-xs text-neutral-500 mb-4">
          <div class="flex justify-between">
            <span>Subtotal</span>
            <span class="font-semibold text-neutral-800"><i class="bi bi-currency-rupee"></i>{{ o.subTotal | number:'1.0-0' }}</span>
          </div>
          @if (o.discountAmount > 0) {
            <div class="flex justify-between text-green-600 font-semibold">
              <span>Discount</span>
              <span>-<i class="bi bi-currency-rupee"></i>{{ o.discountAmount | number:'1.0-0' }}</span>
            </div>
          }
          <div class="flex justify-between">
            <span>Shipping</span>
            <span class="font-semibold text-neutral-800"><i class="bi bi-currency-rupee"></i>{{ o.shippingFee | number:'1.0-0' }}</span>
          </div>
          <div class="flex justify-between">
            <span>GST (5%)</span>
            <span class="font-semibold text-neutral-800"><i class="bi bi-currency-rupee"></i>{{ (o.subTotal * 0.05) | number:'1.0-0' }}</span>
          </div>
          <div class="border-t border-neutral-200 pt-2.5 flex justify-between items-baseline text-sm font-bold text-neutral-800">
            <span>Total Paid</span>
            <span class="text-base font-extrabold text-[var(--color-primary)]"><i class="bi bi-currency-rupee"></i>{{ o.totalAmount | number:'1.0-0' }}</span>
          </div>
        </div>
        
        <!-- Shipping Details & Payment -->
        <div class="border-t border-neutral-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div class="bg-neutral-50 p-3 rounded-xl">
            <p class="font-bold text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Shipping Address</p>
            @if (o.shippingAddress) {
              <p class="font-bold text-neutral-800">
                {{ o.shippingAddress.fullName || (o.shippingAddress.firstName + ' ' + o.shippingAddress.lastName) | titlecase }}
              </p>
              <p class="text-neutral-500 mt-0.5 leading-relaxed text-[11px]">
                {{ o.shippingAddress.street }}, {{ o.shippingAddress.city }}, {{ o.shippingAddress.state }} - {{ o.shippingAddress.zipCode }}
              </p>
              <p class="text-neutral-500 mt-1.5 font-semibold text-[11px]">📞 {{ o.shippingAddress.phone }}</p>
            }
          </div>
          <div class="bg-neutral-50 p-3 rounded-xl flex flex-col justify-between">
            <div>
              <p class="font-bold text-neutral-400 mb-1 uppercase tracking-wider text-[10px]">Payment Method</p>
              <p class="font-bold text-neutral-800 uppercase text-[11px]">{{ o.paymentMethod }}</p>
            </div>
            <div class="mt-2 pt-2 border-t border-neutral-200 border-dashed">
              <p class="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-0.5">Status</p>
              <span class="inline-flex items-center gap-1 font-bold uppercase text-[11px]" 
                    [class.text-green-600]="o.paymentStatus === 'paid'" 
                    [class.text-amber-500]="o.paymentStatus === 'pending'">
                <span class="w-1.5 h-1.5 rounded-full" 
                      [class.bg-green-600]="o.paymentStatus === 'paid'" 
                      [class.bg-amber-500]="o.paymentStatus === 'pending'"></span>
                {{ o.paymentStatus }}
              </span>
            </div>
          </div>
        </div>
      </div>
    }
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
      case 'shipped':
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 1;
    }
  }

  formatStatus(status: string): string {
    if (!status) return 'Placed';
    return status.replace(/_/g, ' ');
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
        status: 'cancelled',
        timestamp: updated,
        note: order.notes || 'Order cancelled.'
      });
    }

    // 2. Delivered Status
    if (status === 'delivered') {
      history.push({
        status: 'delivered',
        timestamp: updated,
        note: 'Package delivered successfully.'
      });
    }

    // 3. Out for Delivery Status
    if (['out_for_delivery', 'delivered'].includes(status)) {
      const outTime = status === 'delivered' ? updated - 1000 * 60 * 60 * 2 : updated; // 2 hours before delivery
      history.push({
        status: 'out_for_delivery',
        timestamp: outTime,
        note: 'Package is out for delivery with our delivery partner.'
      });
    }

    // 4. Shipped Status
    if (['shipped', 'out_for_delivery', 'delivered'].includes(status)) {
      let shippedTime = updated;
      if (status === 'out_for_delivery') {
        shippedTime = (created + updated) / 2;
      } else if (status === 'delivered') {
        shippedTime = created + (updated - created) * 0.5;
      }
      history.push({
        status: 'shipped',
        timestamp: shippedTime,
        note: order.trackingNumber ? `Shipped via courier. Tracking ID: ${order.trackingNumber}` : 'Package shipped.'
      });
    }

    // 5. Confirmed Status (Processing / Confirmed)
    if (['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(status)) {
      const confirmedTime = ['confirmed', 'processing'].includes(status) ? updated : (created + 1000 * 60 * 30); // +30 mins
      history.push({
        status: 'confirmed',
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

  printInvoice() {
    window.print();
  }
}
