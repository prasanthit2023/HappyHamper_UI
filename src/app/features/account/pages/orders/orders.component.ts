import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthStore } from '../../../../state/auth.store';
import { CartStore } from '../../../../state/cart.store';

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

      @if (retryError()) {
        <div class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3" role="alert">
          <svg class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <div class="flex-1">
            <p class="text-xs font-bold text-red-700">{{ retryError() }}</p>
          </div>
          <button (click)="retryError.set('')" class="text-red-400 hover:text-red-600 flex-shrink-0" aria-label="Dismiss">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      }

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
                    <span class="font-bold text-[var(--color-text)]"><i class="bi bi-currency-rupee"></i>{{ order.totalAmount | number:'1.0-0' }}</span>
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

                <div class="w-full sm:w-auto flex gap-2">
                  <!-- Retry Payment button for unpaid orders -->
                  @if (order.paymentStatus !== 'paid' && order.orderStatus !== 'cancelled') {
                    <button
                      (click)="retryPayment(order)"
                      [disabled]="retryingOrderId() === (order._id || order.id)"
                      class="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-white hover:bg-[var(--color-primary)] hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      @if (retryingOrderId() === (order._id || order.id)) {
                        <svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity:.25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" style="opacity:.75"></path></svg>
                        Processing…
                      } @else {
                        <i class="bi bi-credit-card"></i>
                        Pay Now
                      }
                    </button>
                  }
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
  private router = inject(Router);
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);

  orders = signal<any[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<string>('all');
  retryingOrderId = signal<string | null>(null);
  retryError = signal<string>('');

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
    this.loadRazorpayScript();
  }

  private loadRazorpayScript() {
    if ((window as any)['Razorpay']) return;
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.head.appendChild(script);
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

  retryPayment(order: any) {
    const orderId = order.id || order._id;
    this.retryingOrderId.set(orderId);
    this.retryError.set('');
    this.cdr.markForCheck();

    // Re-create (or reuse) the Razorpay order for this DB order
    this.http.post<any>(`${environment.apiUrl}/payments/razorpay/create-order/${orderId}`, {}).subscribe({
      next: (res) => {
        this.retryingOrderId.set(null);
        this.cdr.markForCheck();
        this.openRazorpayPopup(res.data, order.orderNumber, orderId);
      },
      error: (err) => {
        this.retryingOrderId.set(null);
        this.retryError.set(err.error?.message || 'Failed to initialise payment. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  private openRazorpayPopup(paymentData: any, orderNumber: string, orderId: any) {
    const RazorpayClass = (window as any)['Razorpay'];
    if (!RazorpayClass) {
      this.retryError.set('Payment gateway not loaded. Please refresh the page and try again.');
      this.cdr.markForCheck();
      return;
    }

    const user = this.authStore.user();
    const options = {
      key: paymentData.razorpayKeyId,
      amount: paymentData.amount,
      currency: 'INR',
      name: 'Happy Hamper',
      description: `Order #${orderNumber}`,
      order_id: paymentData.razorpayOrderId,
      prefill: {
        name: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        email: (user as any)?.email ?? '',
        contact: user?.phone ?? '',
      },
      // Restrict to INR-compatible domestic payment methods only
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Pay via UPI / Cards / Net Banking',
              instruments: [
                { method: 'upi' },
                { method: 'card', issuers: ['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK'] },
                { method: 'netbanking' },
                { method: 'wallet' },
              ],
            },
          },
          sequence: ['block.banks'],
          preferences: { show_default_blocks: true },
        },
      },
      theme: { color: '#7C3AED' },
      modal: {
        backdropclose: false,
        ondismiss: () => {
          this.retryError.set('Payment cancelled. You can retry anytime from your Orders page.');
          this.cdr.markForCheck();
        },
      },
      'payment.failed': (response: any) => {
        const errCode = response?.error?.code ?? '';
        const errDesc = response?.error?.description ?? '';
        const errReason = response?.error?.reason ?? '';

        let userMessage: string;
        if (
          errReason === 'payment_failed' &&
          (errDesc.toLowerCase().includes('international') || errCode === 'BAD_REQUEST_ERROR')
        ) {
          userMessage = 'International cards are not supported. Please use UPI (GPay / PhonePe), a domestic Visa/Mastercard, or Net Banking.';
        } else if (errDesc) {
          userMessage = `Payment failed: ${errDesc}. Please try a different payment method.`;
        } else {
          userMessage = 'Payment failed. Please try again using UPI, a domestic card, or Net Banking.';
        }
        this.retryError.set(userMessage);
        this.cdr.markForCheck();
      },
      handler: (response: any) => {
        this.verifyAndComplete(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          orderId,
          orderNumber
        );
      },
    };

    const rzp = new RazorpayClass(options);
    rzp.open();
  }

  private verifyAndComplete(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    orderId: any,
    orderNumber: string
  ) {
    this.http.post<any>(`${environment.apiUrl}/payments/razorpay/verify`, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    }).subscribe({
      next: () => {
        this.cartStore.clearCart();
        this.router.navigate(['/checkout/success'], {
          queryParams: { orderId, orderNumber }
        });
      },
      error: (err) => {
        this.retryError.set(
          err.error?.message || 'Payment received but verification failed. Contact support with order: ' + orderNumber
        );
        this.cdr.markForCheck();
        // Still refresh orders so status reflects latest state
        this.fetchOrders();
      },
    });
  }
}
