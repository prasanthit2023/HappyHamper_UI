import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-order-success',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  styles: [`
    /* ── Confetti dots ───────────────────────────────────────── */
    .confetti-wrap {
      position: relative;
      pointer-events: none;
    }
    .confetti-dot {
      position: absolute;
      border-radius: 50%;
      opacity: 0;
      animation: confetti-float 3.5s ease-in-out forwards;
    }
    .confetti-dot:nth-child(1) { width:10px; height:10px; background:#7C83C3; top:-28px; left:8%;  animation-delay:0.15s; }
    .confetti-dot:nth-child(2) { width:7px;  height:7px;  background:#A0958B; top:-18px; left:22%; animation-delay:0.35s; }
    .confetti-dot:nth-child(3) { width:12px; height:12px; background:#E8A598; top:-36px; left:40%; animation-delay:0.1s;  }
    .confetti-dot:nth-child(4) { width:8px;  height:8px;  background:#7C83C3; top:-22px; left:58%; animation-delay:0.45s; }
    .confetti-dot:nth-child(5) { width:10px; height:10px; background:#A8D8B9; top:-30px; left:72%; animation-delay:0.25s; }
    .confetti-dot:nth-child(6) { width:6px;  height:6px;  background:#F9C6BE; top:-14px; left:88%; animation-delay:0.55s; }
    .confetti-dot:nth-child(7) { width:9px;  height:9px;  background:#7C83C3; top:-40px; left:50%; animation-delay:0.05s; }
    .confetti-dot:nth-child(8) { width:11px; height:11px; background:#E8C97E; top:-20px; left:30%; animation-delay:0.65s; }

    @keyframes confetti-float {
      0%   { opacity:0; transform: translateY(0) rotate(0deg) scale(0.4); }
      30%  { opacity:1; }
      100% { opacity:0; transform: translateY(-70px) rotate(720deg) scale(1); }
    }

    /* ── Checkmark circle ────────────────────────────────────── */
    .check-circle {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7C83C3, #a5aade);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 12px 40px rgba(124,131,195,0.35), 0 4px 12px rgba(124,131,195,0.2);
      animation: pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes pop-in {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }

    .check-svg {
      animation: draw-check 0.45s 0.4s ease-out both;
      stroke-dasharray: 40;
      stroke-dashoffset: 40;
    }

    @keyframes draw-check {
      to { stroke-dashoffset: 0; }
    }

    /* ── Action cards ────────────────────────────────────────── */
    .action-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.25rem 1rem;
      border-radius: 16px;
      border: 1.5px solid var(--color-border);
      background: #fff;
      text-decoration: none;
      color: var(--color-text);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      min-width: 0;
    }
    .action-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      border-color: var(--color-primary);
    }
    .action-card-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F0F1FA;
      color: var(--color-primary);
      margin-bottom: 0.25rem;
      flex-shrink: 0;
    }
    .action-card-label {
      font-size: 0.8125rem;
      font-weight: 600;
      text-align: center;
      color: var(--color-text);
      line-height: 1.3;
    }

    /* ── Trust badges ────────────────────────────────────────── */
    .trust-row {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .trust-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--color-text-muted);
    }
    .trust-badge-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-bg-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary);
    }

    /* ── Page entrance ───────────────────────────────────────── */
    .page-enter {
      animation: fade-slide-up 0.5s ease-out both;
    }
    @keyframes fade-slide-up {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Order number chip ───────────────────────────────────── */
    .order-chip {
      display: inline-block;
      font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--color-primary);
      background: #F0F1FA;
      border: 1.5px dashed #c3c7e8;
      border-radius: 8px;
      padding: 0.35rem 1rem;
      letter-spacing: 0.04em;
    }
  `],
  template: `
    <div class="bb-container py-16 page-enter">
      <div class="max-w-lg mx-auto text-center">

        <!-- ── Confetti decorations ── -->
        <div class="confetti-wrap">
          <span class="confetti-dot"></span>
          <span class="confetti-dot"></span>
          <span class="confetti-dot"></span>
          <span class="confetti-dot"></span>
          <span class="confetti-dot"></span>
          <span class="confetti-dot"></span>
          <span class="confetti-dot"></span>
          <span class="confetti-dot"></span>
        </div>

        <!-- ── Animated checkmark ── -->
        <div class="check-circle" aria-hidden="true">
          <svg
            class="check-svg"
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            stroke="white"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="8,22 17,31 36,14" />
          </svg>
        </div>

        <!-- ── Heading ── -->
        <h1 class="section-title mb-2" style="font-size:1.875rem; color: var(--color-text);">
          Order Confirmed! 🎉
        </h1>
        <p class="section-subtitle mb-6" style="max-width:36ch; margin-inline:auto;">
          Thank you for shopping with Happy Hamper. Your order is registered successfully!
        </p>

        <!-- ── Order number (simple fallback or header details) ── -->
        @if (!order() && !loadingDetails()) {
          <div class="card p-6 mb-6 text-center" style="border-color: var(--color-border); background: var(--color-bg-subtle);">
            <span class="text-xs font-semibold uppercase tracking-widest mb-2 block" style="color: var(--color-text-muted);">
              Order Number
            </span>
            <span class="order-chip">{{ orderNumber() || 'HH-PENDING' }}</span>
            <p class="text-xs mt-3 leading-relaxed" style="color: var(--color-text-muted);">
              A confirmation message has been sent to your mobile via WhatsApp.
            </p>
          </div>
        }

        <!-- ── Loading details state ── -->
        @if (loadingDetails()) {
          <div class="card p-6 mb-6 text-center bg-white border border-[var(--color-border)] rounded-2xl animate-pulse">
            <div class="h-4 bg-neutral-100 rounded w-1/3 mx-auto mb-4"></div>
            <div class="space-y-3">
              <div class="h-10 bg-neutral-100 rounded w-full"></div>
              <div class="h-10 bg-neutral-100 rounded w-full"></div>
            </div>
          </div>
        }

        <!-- ── Detailed Order Summary Card ── -->
        @if (order(); as o) {
          <div class="card p-6 mb-6 text-left bg-white border border-[var(--color-border)] shadow-sm rounded-2xl animate-fade-in">
            <div class="flex justify-between items-center border-b border-[var(--color-border)] pb-3 mb-4">
              <div>
                <span class="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Order Reference</span>
                <p class="text-sm font-bold text-[var(--color-primary)] font-mono">{{ o.orderNumber }}</p>
              </div>
              <div class="text-right">
                <span class="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Date</span>
                <p class="text-xs font-semibold text-[var(--color-text)]">{{ o.createdAt | date:'mediumDate' }}</p>
              </div>
            </div>
            
            <h3 class="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-2">Items Ordered</h3>
            
            <!-- Items list -->
            <div class="divide-y divide-[var(--color-border)] border-t border-b border-[var(--color-border)] py-2 mb-4">
              @for (item of o.items; track item.variantSku) {
                <div class="flex items-center gap-3 py-3">
                  <img
                    [src]="item.image || '/assets/placeholder-product.jpg'"
                    [alt]="item.title"
                    class="w-12 h-12 object-cover rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex-shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-[var(--color-text)] truncate">{{ item.title }}</p>
                    <p class="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-medium">
                      Qty: {{ item.quantity }} @if (item.size) { &bull; Size: {{ item.size }} } @if (item.color) { &bull; {{ item.color }} }
                    </p>
                  </div>
                  <span class="text-xs font-bold text-[var(--color-text)] whitespace-nowrap"><i class="bi bi-currency-rupee"></i>{{ (item.price * item.quantity) | number:'1.0-0' }}</span>
                </div>
              }
            </div>
            
            <!-- Totals breakdown -->
            <div class="space-y-2 text-xs text-[var(--color-text-muted)] mb-4">
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span class="font-semibold text-[var(--color-text)]"><i class="bi bi-currency-rupee"></i>{{ o.subTotal | number:'1.0-0' }}</span>
              </div>
              @if (o.discountAmount > 0) {
                <div class="flex justify-between text-green-600 font-semibold">
                  <span>Discount</span>
                  <span>-<i class="bi bi-currency-rupee"></i>{{ o.discountAmount | number:'1.0-0' }}</span>
                </div>
              }
              <div class="flex justify-between">
                <span>Shipping</span>
                <span class="font-semibold text-[var(--color-text)]"><i class="bi bi-currency-rupee"></i>{{ o.shippingFee | number:'1.0-0' }}</span>
              </div>
              <div class="flex justify-between">
                <span>GST (5%)</span>
                <span class="font-semibold text-[var(--color-text)]"><i class="bi bi-currency-rupee"></i>{{ (o.subTotal * 0.05) | number:'1.0-0' }}</span>
              </div>
              <div class="border-t border-[var(--color-border)] pt-2.5 flex justify-between items-baseline text-sm font-bold text-[var(--color-text)]">
                <span>Total Paid</span>
                <span class="text-base font-extrabold text-[var(--color-primary)]"><i class="bi bi-currency-rupee"></i>{{ o.totalAmount | number:'1.0-0' }}</span>
              </div>
            </div>
            
            <!-- Shipping Details & Payment -->
            <div class="border-t border-[var(--color-border)] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="bg-[var(--color-bg-subtle)] p-3 rounded-xl">
                <p class="font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider text-[10px]">Shipping Address</p>
                @if (o.shippingAddress) {
                  <p class="font-bold text-[var(--color-text)]">
                    {{ o.shippingAddress.fullName || (o.shippingAddress.firstName + ' ' + o.shippingAddress.lastName) | titlecase }}
                  </p>
                  <p class="text-[var(--color-text-muted)] mt-0.5 leading-relaxed text-[11px]">
                    {{ o.shippingAddress.street }}, {{ o.shippingAddress.city }}, {{ o.shippingAddress.state }} - {{ o.shippingAddress.zipCode }}
                  </p>
                  <p class="text-[var(--color-text-muted)] mt-1.5 font-semibold text-[11px]">📞 {{ o.shippingAddress.phone }}</p>
                } @else {
                  <p class="text-[var(--color-text-muted)] text-[11px] italic">Address details not available</p>
                }
              </div>
              <div class="bg-[var(--color-bg-subtle)] p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <p class="font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider text-[10px]">Payment Method</p>
                  <p class="font-bold text-[var(--color-text)] uppercase text-[11px]">{{ o.paymentMethod }}</p>
                </div>
                <div class="mt-2 pt-2 border-t border-[var(--color-border)] border-dashed">
                  <p class="font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-[10px] mb-0.5">Status</p>
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

        <!-- ── Estimated delivery ── -->
        <div class="flex items-center justify-center gap-2 mb-8">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color: var(--color-primary);">
            <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 4v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <span class="text-sm font-medium" style="color: var(--color-text-muted);">
            Estimated delivery: <strong style="color: var(--color-text);">5–7 business days</strong>
          </span>
        </div>

        <!-- ── Action cards ── -->
        <div class="flex gap-3 mb-8" role="list">

          <!-- Track Order -->
          <a
            [routerLink]="order() ? '/account/orders/' + order().id : '/account/orders'"
            class="action-card shadow-sm"
            role="listitem"
            aria-label="Track your order"
          >
            <div class="action-card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v4"/>
                <path d="M14 17l2 2 4-4"/>
              </svg>
            </div>
            <span class="action-card-label">Track<br>Order</span>
          </a>

          <!-- Continue Shopping -->
          <a
            routerLink="/products"
            class="action-card shadow-sm"
            role="listitem"
            aria-label="Continue shopping"
          >
            <div class="action-card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <span class="action-card-label">Continue<br>Shopping</span>
          </a>

          <!-- View All Orders -->
          <a
            routerLink="/account/orders"
            class="action-card shadow-sm"
            role="listitem"
            aria-label="View all orders"
          >
            <div class="action-card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
              </svg>
            </div>
            <span class="action-card-label">View All<br>Orders</span>
          </a>

        </div>

        <!-- ── Trust badges ── -->
        <div class="trust-row mb-10" aria-label="Trust signals">

          <div class="trust-badge">
            <div class="trust-badge-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <span>Secure Checkout</span>
          </div>

          <div class="trust-badge">
            <div class="trust-badge-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v4"/><path d="M14 17l2 2 4-4"/><circle cx="7.5" cy="17.5" r="2.5"/>
              </svg>
            </div>
            <span>Fast Delivery</span>
          </div>

          <div class="trust-badge">
            <div class="trust-badge-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
              </svg>
            </div>
            <span>Easy Returns</span>
          </div>

        </div>

        <!-- ── Primary CTA ── -->
        <a
          routerLink="/products"
          class="btn-primary"
          style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.75rem 2rem;"
          aria-label="Continue shopping for more products"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          Continue Shopping
        </a>

      </div>
    </div>
  `,
})
export class OrderSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  readonly orderNumber = signal<string>('');
  readonly order = signal<any | null>(null);
  readonly loadingDetails = signal<boolean>(false);

  ngOnInit(): void {
    const num = this.route.snapshot.queryParamMap.get('orderNumber') ?? '';
    const id = this.route.snapshot.queryParamMap.get('orderId') ?? '';
    this.orderNumber.set(num);

    if (id) {
      this.fetchOrderDetails(id);
    }

    // Trigger success toast after a short delay so the animation settles first
    setTimeout(() => {
      this.toastService.success('Order placed successfully! 🎉');
    }, 600);
  }

  fetchOrderDetails(id: string) {
    this.loadingDetails.set(true);
    this.cdr.markForCheck();

    this.http.get<any>(`${environment.apiUrl}/orders/${id}`).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.loadingDetails.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingDetails.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
