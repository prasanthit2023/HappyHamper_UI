import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthStore } from '../../../../state/auth.store';

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
          <button (click)="downloadInvoice()" class="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <svg style="width:14px;height:14px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Download Invoice (PDF)
          </button>
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
                    <img [src]="item.image || 'assets/placeholder-product.svg'" (error)="$any($event.target).src = 'assets/placeholder-product.svg'" class="w-16 h-16 object-cover rounded-xl bg-[var(--color-bg-subtle)] border border-[var(--color-border)] flex-shrink-0" />
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
            @if (o.orderStatus === 'delivered' && !returnRequested() && o.orderStatus !== 'return_requested') {
              <div class="card p-4 space-y-3 border-amber-200 bg-amber-50/20 rounded-2xl">
                <h4 class="font-bold text-xs uppercase tracking-wider text-amber-700">Request Return</h4>
                <p class="text-xs text-[var(--color-text-muted)] leading-relaxed">Delivered items can be returned within 7 days of arrival.</p>
                <button type="button" (click)="confirmReturn()" [disabled]="actionLoading()" class="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider">Return Order</button>
              </div>
            } @else if (returnRequested() || o.orderStatus === 'return_requested') {
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
      <div class="printable-invoice hidden-on-screen border border-neutral-200 shadow-sm rounded-3xl p-6 sm:p-8 bg-white mb-6 text-left" style="color: #1f2937 !important;">
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

    <!-- Return Policy Confirmation Modal -->
    @if (showReturnPolicyModal()) {
      <div class="fixed inset-0 z-[10000] animate-fade-in flex items-center justify-center p-4" style="background: rgba(45,45,45,0.4); backdrop-filter: blur(2px);">
        <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 max-w-2xl w-full overflow-hidden transform scale-100 animate-scale-in flex flex-col max-h-[85vh]">
          
          <!-- Modal Header -->
          <div class="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 class="font-display font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Confirm Return Policy & Terms
            </h3>
            <button (click)="showReturnPolicyModal.set(false)" class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Modal Body (Scrollable Policy Text) -->
          <div class="p-6 overflow-y-auto space-y-5 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-h-[50vh]">
            <p class="font-bold text-neutral-950 dark:text-white">
              Please review our Return Policy before confirming your return request:
            </p>
            
            <div style="background: #f9fafb; border: 1px solid #f3f4f6;" class="dark:bg-neutral-800/40 dark:border-neutral-700/60 p-4 rounded-2xl text-xs space-y-4">
              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">1. Eligibility for Return</h4>
                <p>A return may be requested if:</p>
                <ul class="list-disc pl-4 mt-1 space-y-1">
                  <li>The product received is damaged or defective.</li>
                  <li>The wrong product, size, colour, or design was delivered.</li>
                  <li>The product received is different from the product ordered.</li>
                </ul>
              </div>

              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">2. Time Limit</h4>
                <p>Return requests must be raised within 7 days of delivery. Requests made after this period may not be accepted.</p>
              </div>

              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">3. Product Condition</h4>
                <p>To be eligible for return:</p>
                <ul class="list-disc pl-4 mt-1 space-y-1">
                  <li>The product must be unused, unworn, and unwashed.</li>
                  <li>All original tags, labels, and packaging should be intact.</li>
                  <li>The product must be returned in its original condition.</li>
                  <li>The product must not have any stains, odour, damage, or signs of use.</li>
                </ul>
              </div>

              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">4. Proof Required</h4>
                <p>For damaged, defective, or incorrect products, customers may be required to provide:</p>
                <ul class="list-disc pl-4 mt-1 space-y-1">
                  <li>Clear photographs of the product.</li>
                  <li>A video of the package opening, where applicable.</li>
                  <li>The order details or order number.</li>
                </ul>
                <p class="mt-1.5 italic text-neutral-450">This information may be required to verify the return request.</p>
              </div>

              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">5. Wrong Size</h4>
                <p>Return for a wrong size ordered by the customer will be accepted only if the product is unused, unworn, unwashed, and available in the required size. Return is subject to stock availability.</p>
              </div>

              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">6. Product Availability</h4>
                <p>If the requested return product is unavailable, we may offer:</p>
                <ul class="list-disc pl-4 mt-1 space-y-1">
                  <li>An alternative product of similar value; or</li>
                  <li>Another suitable resolution at our discretion.</li>
                </ul>
              </div>

              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">7. Shipping Charges</h4>
                <p>If the return is due to an error on our part, such as receiving a damaged, defective, or incorrect product, we will arrange the return according to our applicable shipping process.</p>
                <p class="mt-1">For a customer-requested size or product change, additional shipping charges may apply.</p>
              </div>

              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">8. Non-Returnable Products</h4>
                <p>Products may not be eligible for return if:</p>
                <ul class="list-disc pl-4 mt-1 space-y-1">
                  <li>They have been used, worn, washed, or altered.</li>
                  <li>They are damaged due to improper use or care.</li>
                  <li>They have stains, odour, or other signs of use.</li>
                  <li>The product is damaged after delivery due to customer handling.</li>
                  <li>The return request is made after the applicable time period (7 days).</li>
                </ul>
              </div>

              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">9. Inspection and Approval</h4>
                <p>All return requests are subject to inspection and approval by Happy Hamper. We reserve the right to reject a return request if the product does not meet the conditions stated in this policy.</p>
              </div>

              <div>
                <h4 class="font-bold text-neutral-950 dark:text-white mb-1">10. How to Request a Return</h4>
                <p>To request a return, please contact our customer support team through the official contact channel and provide: Order number, Reason for return, and Clear photographs/videos if required.</p>
              </div>
            </div>

            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              By clicking "Confirm Return", you agree to the Return Terms & Conditions of Happy Hamper.
            </p>
          </div>

          <!-- Modal Footer -->
          <div class="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-end gap-3">
            <button
              (click)="showReturnPolicyModal.set(false)"
              class="px-5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              (click)="executeReturnFromModal()"
              class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-650 hover:bg-red-700 shadow-md shadow-red-100 dark:shadow-none transition-all active:scale-95 cursor-pointer"
            >
              Confirm Return
            </button>
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
  private platformId = inject(PLATFORM_ID);
  readonly confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);
  readonly authStore = inject(AuthStore);

  private routeSub!: Subscription;

  order = signal<any | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  actionLoading = signal<boolean>(false);
  returnRequested = signal<boolean>(false);
  showReturnPolicyModal = signal<boolean>(false);

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
    if (status === 'return_requested') return 'Return Requested';
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

  confirmReturn() {
    this.showReturnPolicyModal.set(true);
    this.cdr.markForCheck();
  }

  executeReturnFromModal() {
    this.showReturnPolicyModal.set(false);
    this.executeReturn();
  }

  executeReturn() {
    const o = this.order();
    if (!o) return;

    this.actionLoading.set(true);
    this.cdr.markForCheck();

    const payload = {
      orderId: o._id || o.id,
      items: o.items.map((i: any) => ({ variantSku: i.variantSku, quantity: i.quantity })),
      reason: 'Customer Return Request',
    };

    this.http.post<any>(`${environment.apiUrl}/returns`, payload).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.returnRequested.set(true);
        if (this.order()) {
          this.order.set({
            ...this.order(),
            orderStatus: 'return_requested'
          });
        }
        this.toastService.success('Your return request has been submitted successfully.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toastService.error(err.error?.message || 'Failed to submit return request.');
        this.cdr.markForCheck();
      },
    });
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
