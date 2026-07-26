import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { AuthStore } from '../../../../state/auth.store';

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

    /* ── Print styles for Tax Invoice ───────────────────────── */
    @media print {
      /* Hide regular web page layouts entirely */
      .no-print, bb-navbar, bb-footer, bb-cart-drawer, bb-toast {
        display: none !important;
      }
      /* Hide other sibling elements on the page */
      .bb-container > :not(.printable-invoice) {
        display: none !important;
      }
      .max-w-lg > :not(.printable-invoice) {
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
      .bb-container, .max-w-lg, main, .page-enter {
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      /* Format print invoice beautifully */
      .printable-invoice {
        display: block !important;
        width: 100% !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        background: #fff !important;
        color: #000 !important;
      }
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

        <!-- ── Detailed Order Summary Card (Printable Tax Invoice) ── -->
        @if (order(); as o) {
          <div class="printable-invoice border border-neutral-200 shadow-sm rounded-3xl p-6 sm:p-8 bg-white mb-6 text-left" style="color: #1f2937 !important;">
            <!-- Invoice Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-neutral-100 pb-5 mb-6">
              <div>
                <h2 style="font-size: 1.5rem; font-weight: 850; color: var(--color-primary, #2eafb0); margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px;">Happy Hamper</h2>
                <p style="font-size: 11px; color: #6b7280; margin: 2px 0;">123 Luxury Lane, Fashion District</p>
                <p style="font-size: 11px; color: #6b7280; margin: 2px 0;">New Delhi, Delhi, 110001</p>
                <p style="font-size: 11px; color: #6b7280; margin: 2px 0;">Email: care&#64;happyhamper.com | Phone: +91 98765 43210</p>
                <p style="font-size: 11px; color: #6b7280; margin: 2px 0; font-weight: 600;">GSTIN: 07AAAAA1111A1Z1</p>
              </div>
              <div class="text-left sm:text-right w-full sm:w-auto">
                <h3 style="font-size: 1.75rem; font-weight: 900; color: #111827; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">TAX INVOICE</h3>
                <p style="font-size: 11px; color: #6b7280; margin: 2px 0;"><strong>Invoice No:</strong> <span style="font-family: monospace; font-weight: 700; color: #111827;">{{ o.orderNumber }}</span></p>
                <p style="font-size: 11px; color: #6b7280; margin: 2px 0;"><strong>Date:</strong> {{ o.createdAt | date:'mediumDate' }}</p>
                <p style="font-size: 11px; color: #6b7280; margin: 2px 0;"><strong>Order Status:</strong> <span style="text-transform: uppercase; font-weight: 700; color: #111827;">{{ formatStatus(o.orderStatus) }}</span></p>
              </div>
            </div>

            <!-- Customer Details Block -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 16px;">
                <h4 style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9ca3af; margin: 0 0 8px 0; letter-spacing: 0.5px;">Bill To / Ship To</h4>
                @if (o.shippingAddress) {
                  <p style="font-size: 12px; font-weight: 750; color: #111827; margin: 2px 0;">{{ o.shippingAddress.fullName || (o.shippingAddress.firstName + ' ' + o.shippingAddress.lastName) | titlecase }}</p>
                  <p style="font-size: 11px; color: #4b5563; margin: 2px 0; line-height: 1.4;">{{ o.shippingAddress.street }}, {{ o.shippingAddress.city }}, {{ o.shippingAddress.state }} - {{ o.shippingAddress.zipCode }}</p>
                  <p style="font-size: 11px; color: #4b5563; margin: 4px 0 0 0; font-weight: 600;">📞 {{ o.shippingAddress.phone }}</p>
                } @else {
                  <p style="font-size: 11px; color: #9ca3af; font-style: italic;">Address not available</p>
                }
              </div>
              <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 16px;">
                <h4 style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9ca3af; margin: 0 0 8px 0; letter-spacing: 0.5px;">Customer Account</h4>
                <p style="font-size: 12px; font-weight: 750; color: #111827; margin: 2px 0;">
                  {{ o.shippingAddress?.fullName || authStore.user()?.firstName + ' ' + authStore.user()?.lastName || 'Customer Profile' | titlecase }}
                </p>
                <p style="font-size: 11px; color: #4b5563; margin: 2px 0;">
                  <strong>Email:</strong> {{ $any(authStore.user())?.email || (o.shippingAddress?.fullName ? (o.shippingAddress.fullName.toLowerCase().replace(' ', '') + '@gmail.com') : 'customer@happyhamper.com') }}
                </p>
                <p style="font-size: 11px; color: #4b5563; margin: 2px 0;">
                  <strong>Phone:</strong> {{ o.shippingAddress?.phone || authStore.user()?.phone || 'N/A' }}
                </p>
              </div>
            </div>

            <!-- Product Table -->
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; min-width: 500px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #374151; padding: 10px 12px; text-align: left;">Product</th>
                    <th style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #374151; padding: 10px 12px; text-align: left;">SKU</th>
                    <th style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #374151; padding: 10px 12px; text-align: center;">Qty</th>
                    <th style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #374151; padding: 10px 12px; text-align: right;">Unit Price</th>
                    <th style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #374151; padding: 10px 12px; text-align: right;">Total Price</th>
                  </tr>
                </thead>
                <tbody style="border-bottom: 1px solid #e5e7eb;">
                  @for (item of o.items; track item.variantSku) {
                    <tr style="border-bottom: 1px solid #f3f4f6;">
                      <td style="padding: 12px; display: flex; align-items: center; gap: 12px; border: none;">
                        <img
                          [src]="item.image || 'assets/placeholder-product.svg'"
                          (error)="$any($event.target).src = 'assets/placeholder-product.svg'"
                          [alt]="item.title"
                          style="width: 38px; height: 38px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #f9fafb; border: 1px solid #e5e7eb;"
                        />
                        <div>
                          <p style="font-size: 12px; font-weight: 700; color: #111827; margin: 0;">{{ item.title }}</p>
                          <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">
                            @if (item.size) { <span>Size: {{ item.size }}</span> }
                            @if (item.color) { <span style="margin-left: 6px;">Color: {{ item.color }}</span> }
                          </div>
                        </div>
                      </td>
                      <td style="padding: 12px; font-size: 11px; font-family: monospace; color: #4b5563; border: none;">
                        {{ item.variantSku || 'N/A' }}
                      </td>
                      <td style="padding: 12px; font-size: 12px; color: #111827; text-align: center; border: none;">
                        {{ item.quantity }}
                      </td>
                      <td style="padding: 12px; font-size: 12px; color: #111827; text-align: right; border: none; font-weight: 600;">
                        ₹{{ item.price | number:'1.0-0' }}
                      </td>
                      <td style="padding: 12px; font-size: 12px; color: #111827; text-align: right; border: none; font-weight: 700;">
                        ₹{{ (item.price * item.quantity) | number:'1.0-0' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Totals & Payment summary section -->
            <div class="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-neutral-100 pb-5 mb-6">
              <div style="flex: 1; width: 100%; background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 16px;">
                <h4 style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9ca3af; margin: 0 0 8px 0; letter-spacing: 0.5px;">Payment Details</h4>
                <p style="font-size: 11px; color: #4b5563; margin: 4px 0;"><strong>Method:</strong> <span style="text-transform: uppercase; font-weight: 600;">{{ o.paymentMethod || 'Razorpay' }}</span></p>
                <p style="font-size: 11px; color: #4b5563; margin: 4px 0;">
                  <strong>Status:</strong> 
                  <span style="font-weight: 700; text-transform: uppercase; margin-left: 2px;"
                        [class.text-green-600]="o.paymentStatus === 'paid'"
                        [class.text-amber-500]="o.paymentStatus === 'pending'">
                    {{ o.paymentStatus }}
                  </span>
                </p>
              </div>
              <div class="w-full md:w-80 ml-auto">
                <table style="width: 100%; border-collapse: collapse;">
                  <tbody>
                    <tr style="border: none;">
                      <td style="padding: 6px 0; font-size: 12px; color: #6b7280; text-align: left; border: none;">Subtotal</td>
                      <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #111827; text-align: right; border: none;">₹{{ o.subTotal | number:'1.0-0' }}</td>
                    </tr>
                    @if (o.discountAmount > 0) {
                      <tr style="border: none;">
                        <td style="padding: 6px 0; font-size: 12px; color: #10b981; text-align: left; border: none; font-weight: 600;">Coupon Discount</td>
                        <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #10b981; text-align: right; border: none;">-₹{{ o.discountAmount | number:'1.0-0' }}</td>
                      </tr>
                    }
                    <tr style="border: none;">
                      <td style="padding: 6px 0; font-size: 12px; color: #6b7280; text-align: left; border: none;">Shipping Charge</td>
                      <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #111827; text-align: right; border: none;">
                        @if (o.shippingFee > 0) { ₹{{ o.shippingFee | number:'1.0-0' }} } @else { Free }
                      </td>
                    </tr>
                    <tr style="border: none;">
                      <td style="padding: 6px 0; font-size: 12px; color: #6b7280; text-align: left; border: none;">GST (5%)</td>
                      <td style="padding: 6px 0; font-size: 12px; font-weight: 600; color: #111827; text-align: right; border: none;">₹{{ (o.subTotal * 0.05) | number:'1.0-0' }}</td>
                    </tr>
                    <tr style="border-top: 1.5px solid #e5e7eb;">
                      <td style="padding: 10px 0 0 0; font-size: 13px; font-weight: 800; color: #111827; text-align: left; border: none;">Total Amount</td>
                      <td style="padding: 10px 0 0 0; font-size: 15px; font-weight: 850; color: var(--color-primary, #2eafb0); text-align: right; border: none;">₹{{ o.totalAmount | number:'1.0-0' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Return Policy Section -->
            <div style="background: #fffdfa; border: 1px solid #fef3c7; border-radius: 16px; padding: 16px;">
              <h4 style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #b45309; margin: 0 0 8px 0; letter-spacing: 0.5px; display: flex; align-items: center; gap: 4px;">
                ⚠️ Return Policy & Terms
              </h4>
              <ul style="list-style-type: disc; padding-left: 16px; margin: 0; display: grid; gap: 4px;">
                <li style="font-size: 11px; color: #d97706; line-height: 1.4;">Returns are accepted within 7 days of delivery.</li>
                <li style="font-size: 11px; color: #d97706; line-height: 1.4;">Products must be unused, unwashed, and in their original packaging.</li>
                <li style="font-size: 11px; color: #d97706; line-height: 1.4;">Refunds are processed to the original payment source after inspection.</li>
                <li style="font-size: 11px; color: #d97706; line-height: 1.4;">Shipping charges are non-refundable unless the product is defective.</li>
              </ul>
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
            class="action-card shadow-sm no-print"
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

          <!-- Download Invoice (PDF) -->
          <button
            (click)="downloadInvoice()"
            class="action-card shadow-sm no-print text-left"
            role="listitem"
            aria-label="Download tax invoice as PDF"
          >
            <div class="action-card-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <span class="action-card-label">Download<br>Invoice</span>
          </button>

          <!-- Continue Shopping -->
          <a
            routerLink="/products"
            class="action-card shadow-sm no-print"
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
  private platformId = inject(PLATFORM_ID);
  readonly authStore = inject(AuthStore);

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

  formatStatus(status: string): string {
    if (!status) return 'Placed';
    if (status === 'return_requested') return 'Return Requested';
    return status.replace(/_/g, ' ');
  }

  async downloadInvoice() {
    const o = this.order();
    if (!o) return;

    const { isPlatformBrowser } = await import('@angular/common');
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const invoiceElement = document.querySelector('.printable-invoice') as HTMLElement;
      if (!invoiceElement) {
        console.error('Invoice element not found');
        return;
      }

      const originalStyle = invoiceElement.style.cssText;
      invoiceElement.style.cssText = `
        background: #ffffff !important;
        color: #000000 !important;
        width: 790px !important;
        padding: 30px !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      `;

      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      invoiceElement.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`Invoice-${o.orderNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
  }
}
