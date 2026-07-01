import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartStore, CartItem } from '../../../../state/cart.store';

@Component({
  selector: 'bb-cart-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="bb-container py-8 page-enter animate-fade-in">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-6" aria-label="Breadcrumb">
        <a routerLink="/" class="hover:text-[var(--color-primary)] transition-colors font-medium">Home</a>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
        <span class="text-[var(--color-text)] font-semibold">Cart</span>
      </nav>

      <h1 class="text-3xl font-extrabold text-[var(--color-text)] font-display mb-8 flex items-center gap-3">
        <svg class="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/>
        </svg>
        Your Shopping Cart
        @if (!cartStore.isEmpty()) {
          <span class="badge badge-primary text-sm font-bold px-3 py-1 ml-1">{{ cartStore.itemCount() }}</span>
        }
      </h1>

      <!-- Loading Skeleton -->
      @if (cartStore.loading() && cartStore.cart().items.length === 0) {
        <div class="space-y-4">
          <div class="skeleton h-24 w-full rounded-2xl"></div>
          <div class="skeleton h-24 w-full rounded-2xl"></div>
          <div class="skeleton h-24 w-full rounded-2xl"></div>
        </div>

      <!-- Empty State -->
      } @else if (cartStore.isEmpty()) {
        <div class="card p-12 text-center max-w-lg mx-auto space-y-6 animate-slide-up">
          <!-- SVG Shopping Bag Illustration -->
          <div class="flex justify-center">
            <svg class="w-32 h-32 text-[var(--color-border)]" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="20" y="45" width="80" height="60" rx="8" fill="var(--color-bg-subtle)" stroke="var(--color-border)" stroke-width="3"/>
              <path d="M42 45V35a18 18 0 0136 0v10" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
              <circle cx="47" cy="45" r="4" fill="var(--color-primary)" opacity="0.3"/>
              <circle cx="73" cy="45" r="4" fill="var(--color-primary)" opacity="0.3"/>
              <path d="M40 72 Q60 85 80 72" stroke="var(--color-sandal)" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
              <circle cx="55" cy="62" r="3" fill="var(--color-primary)" opacity="0.2"/>
              <circle cx="65" cy="62" r="3" fill="var(--color-primary)" opacity="0.2"/>
            </svg>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-[var(--color-text)] mb-2">Your cart is empty</h3>
            <p class="text-sm text-[var(--color-text-muted)] leading-relaxed">
              Explore our premium organic baby & kids collection and find something adorable for your little ones!
            </p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a routerLink="/products" class="btn-primary py-3 px-8 inline-flex items-center gap-2" aria-label="Browse all products">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/>
              </svg>
              Shop Now
            </a>
            <a routerLink="/products" [queryParams]="{newArrival: true}" class="btn-secondary py-3 px-6 inline-flex items-center gap-2" aria-label="View new arrivals">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
              New Arrivals
            </a>

          </div>
          <!-- Trust badges in empty state -->
          <div class="flex flex-wrap justify-center gap-4 pt-4 border-t border-[var(--color-border)]">
            <span class="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Secure Checkout
            </span>
            <span class="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1.6 12h10.8L19 8"/>
              </svg>
              Free Delivery <i class="bi bi-currency-rupee"></i>499+
            </span>
            <span class="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              7-Day Returns
            </span>
          </div>
        </div>


      <!-- Cart with Items -->
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- Left Column: Cart Items -->
          <div class="lg:col-span-2 space-y-4">

            <!-- Continue Shopping Link -->
            <div class="flex items-center justify-between mb-2">
              <a routerLink="/products"
                 class="text-sm text-[var(--color-primary)] font-semibold hover:underline inline-flex items-center gap-1.5 transition-colors"
                 aria-label="Continue shopping">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Continue Shopping
              </a>
              <span class="text-xs text-[var(--color-text-muted)]">{{ cartStore.itemCount() }} item{{ cartStore.itemCount() === 1 ? '' : 's' }}</span>
            </div>

            <!-- Free Shipping Progress Bar -->
            @if (cartStore.remainingForFreeShipping() > 0) {
              <div class="card p-4 space-y-2" role="region" aria-label="Free shipping progress">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-[var(--color-text)] flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1.6 12h10.8L19 8"/>
                    </svg>
                    Add <span class="text-[var(--color-primary)] font-bold mx-1"><i class="bi bi-currency-rupee"></i>{{ cartStore.remainingForFreeShipping() | number:'1.0-0' }}</span> more for FREE shipping!
                  </span>
                  <span class="text-[var(--color-text-muted)]"><i class="bi bi-currency-rupee"></i>{{ cartStore.subTotal() | number:'1.0-0' }} / <i class="bi bi-currency-rupee"></i>{{ cartStore.freeShippingThreshold }}</span>
                </div>
                <div class="w-full bg-[var(--color-border)] rounded-full h-2.5 overflow-hidden">
                  <div
                    class="h-2.5 rounded-full transition-all duration-700 ease-out"
                    style="background: var(--gradient-primary); width: {{ shippingProgressPct() }}%"
                    role="progressbar"
                    [attr.aria-valuenow]="shippingProgressPct()"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            } @else {
              <div class="card p-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-xs font-bold">🎉 You've unlocked FREE shipping!</span>
              </div>
            }

            <!-- Cart Items List -->
            @for (item of cartStore.cart().items; track item.variantSku) {
              <div class="card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between hover-lift transition-shadow" role="listitem">
                <div class="flex items-center gap-4 w-full sm:w-auto">
                  <!-- Clickable Product Image -->
                  <a
                    [routerLink]="['/products', item.productId]"
                    class="w-20 h-20 rounded-xl overflow-hidden bg-[var(--color-bg-subtle)] flex-shrink-0 block ring-2 ring-transparent hover:ring-[var(--color-primary)] transition-all"
                    [attr.aria-label]="'View ' + item.title"
                  >
                    <img
                      [src]="item.image || '/assets/placeholder-product.jpg'"
                      [alt]="item.title"
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </a>
                  <div>
                    <a [routerLink]="['/products', item.productId]" class="hover:text-[var(--color-primary)] transition-colors">
                      <h3 class="font-bold text-sm text-[var(--color-text)] leading-snug">{{ item.title }}</h3>
                    </a>
                    <p class="text-xs text-[var(--color-text-muted)] mt-0.5">SKU: {{ item.variantSku }}</p>
                    @if (item.size || item.color) {
                      <div class="flex gap-2 mt-1.5 flex-wrap">
                        @if (item.size) {
                          <span class="text-[10px] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] px-2 py-0.5 rounded-md font-semibold text-[var(--color-text-muted)]">
                            Size: {{ item.size }}
                          </span>
                        }
                        @if (item.color) {
                          <span class="text-[10px] bg-[var(--color-bg-subtle)] border border-[var(--color-border)] px-2 py-0.5 rounded-md font-semibold text-[var(--color-text-muted)]">
                            Color: {{ item.color }}
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Price and Quantity Control -->
                <div class="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto">
                  <div class="text-right">
                    <span class="font-bold text-base text-[var(--color-text)]">
                      <i class="bi bi-currency-rupee"></i>{{ (item.price * item.quantity) | number:'1.0-0' }}
                    </span>
                    <span class="text-xs text-[var(--color-text-muted)] block"><i class="bi bi-currency-rupee"></i>{{ item.price | number:'1.0-0' }} each</span>
                  </div>

                  <!-- Quantity Incrementor -->
                  <div class="flex items-center border border-[var(--color-border)] rounded-xl overflow-hidden bg-white shadow-sm" role="group" [attr.aria-label]="'Quantity for ' + item.title">
                    <button
                      (click)="updateQty(item, item.quantity - 1)"
                      class="px-3 py-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-primary)] transition-colors font-bold text-lg leading-none"
                      [disabled]="item.quantity <= 1"
                      [attr.aria-label]="'Decrease quantity of ' + item.title"
                    >&minus;</button>
                    <span class="px-3 font-bold text-sm text-[var(--color-text)] min-w-[2rem] text-center">{{ item.quantity }}</span>
                    <button
                      (click)="updateQty(item, item.quantity + 1)"
                      class="px-3 py-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-primary)] transition-colors font-bold text-lg leading-none"
                      [attr.aria-label]="'Increase quantity of ' + item.title"
                    >+</button>
                  </div>

                  <!-- Remove Button -->
                  <button
                    (click)="removeItem(item.variantSku)"
                    class="text-red-400 hover:text-red-600 w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0"
                    [attr.aria-label]="'Remove ' + item.title + ' from cart'"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Right Column: Order Summary -->
          <div class="space-y-4">
            <div class="card p-6 space-y-4 sticky top-4">
              <h2 class="font-bold text-lg text-[var(--color-text)] border-b border-[var(--color-border)] pb-3">Order Summary</h2>

              <!-- Savings Banner -->
              @if (cartStore.cart().discountAmount > 0) {
                <div class="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2 animate-slide-up">
                  <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-sm font-bold text-green-700">
                    🎉 You saved <i class="bi bi-currency-rupee"></i>{{ cartStore.cart().discountAmount | number:'1.0-0' }}!
                  </p>
                </div>
              }

              <div class="space-y-2.5 text-sm">
                <div class="flex justify-between text-[var(--color-text-muted)]">
                  <span>Subtotal ({{ cartStore.itemCount() }} items)</span>
                  <span class="font-semibold text-[var(--color-text)]"><i class="bi bi-currency-rupee"></i>{{ cartStore.subTotal() | number:'1.0-0' }}</span>
                </div>

                @if (cartStore.cart().discountAmount > 0) {
                  <div class="flex justify-between text-green-600 font-semibold">
                    <span class="flex items-center gap-1">
                      <span class="badge badge-discount text-[10px] py-0.5 px-1.5">{{ cartStore.cart().couponCode }}</span>
                      Discount
                    </span>
                    <span>-<i class="bi bi-currency-rupee"></i>{{ cartStore.cart().discountAmount | number:'1.0-0' }}</span>
                  </div>
                }

                <div class="flex justify-between text-[var(--color-text-muted)]">
                  <span>Shipping</span>
                  @if (cartStore.subTotal() >= cartStore.freeShippingThreshold) {
                    <span class="font-bold text-green-600">FREE</span>
                  } @else {
                    <span class="font-semibold text-[var(--color-text)]"><i class="bi bi-currency-rupee"></i>49</span>
                  }
                </div>

                <div class="flex justify-between text-[var(--color-text-muted)]">
                  <span>GST (5%)</span>
                  <span class="font-semibold text-[var(--color-text)]"><i class="bi bi-currency-rupee"></i>{{ (cartStore.subTotal() * 0.05) | number:'1.0-0' }}</span>
                </div>
              </div>

              <!-- Coupon Code Field -->
              <div class="border-t border-[var(--color-border)] pt-4 space-y-2">
                <label class="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide">Promo Code</label>
                @if (cartStore.cart().couponCode) {
                  <div class="flex justify-between items-center bg-green-50 border border-green-200 px-3 py-2.5 rounded-xl text-sm">
                    <span class="font-bold text-green-700 flex items-center gap-1.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                      {{ cartStore.cart().couponCode }} applied!
                    </span>
                    <button (click)="removeCoupon()" class="text-xs text-red-500 hover:text-red-700 font-bold transition-colors" aria-label="Remove coupon code">Remove</button>
                  </div>
                } @else {
                  <div class="flex gap-2">
                    <input
                      type="text"
                      [(ngModel)]="couponCode"
                      placeholder="Enter code (e.g. FIRST10)"
                      class="input-field py-2 text-sm"
                      aria-label="Coupon code input"
                      (keyup.enter)="applyCoupon()"
                    />
                    <button (click)="applyCoupon()" class="btn-secondary py-2 px-4 text-xs font-bold whitespace-nowrap" aria-label="Apply coupon code">Apply</button>
                  </div>
                  @if (couponError()) {
                    <p class="text-red-500 text-xs mt-1 flex items-center gap-1" role="alert">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ couponError() }}
                    </p>
                  }
                }
              </div>

              <!-- Total amount -->
              <div class="border-t border-[var(--color-border)] pt-4 flex justify-between items-baseline">
                <span class="font-bold text-base text-[var(--color-text)]">Total</span>
                <span class="text-2xl font-black" style="color: var(--color-primary)">
                  <i class="bi bi-currency-rupee"></i>{{ grandTotal() | number:'1.0-0' }}
                </span>
              </div>

              <!-- Estimated Delivery -->
              <div class="flex items-center gap-2 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl px-3 py-2.5">
                <svg class="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <p class="text-xs text-[var(--color-text-muted)]">
                  <span class="font-semibold text-[var(--color-text)]">Estimated delivery:</span> 3–5 business days
                </p>
              </div>

              <!-- Checkout CTA -->
              <button
                (click)="proceedToCheckout()"
                class="btn-primary w-full py-4 text-sm font-bold mt-2 flex items-center justify-center gap-2"
                aria-label="Proceed to checkout"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                Proceed to Checkout
              </button>

              <!-- Trust Badges -->
              <div class="pt-3 border-t border-[var(--color-border)]">
                <div class="grid grid-cols-3 gap-2 text-center">
                  <div class="flex flex-col items-center gap-1 px-1">
                    <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                    </div>
                    <span class="text-[9px] font-semibold text-[var(--color-text-muted)] leading-tight">Secure Checkout (SSL)</span>
                  </div>
                  <div class="flex flex-col items-center gap-1 px-1">
                    <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1.6 12h10.8L19 8"/>
                      </svg>
                    </div>
                    <span class="text-[9px] font-semibold text-[var(--color-text-muted)] leading-tight">Free Delivery <i class="bi bi-currency-rupee"></i>499+</span>
                  </div>
                  <div class="flex flex-col items-center gap-1 px-1">
                    <div class="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                      <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    </div>
                    <span class="text-[9px] font-semibold text-[var(--color-text-muted)] leading-tight">7-Day Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartComponent {
  readonly cartStore = inject(CartStore);
  private router = inject(Router);

  couponCode = '';
  couponError = signal<string>('');

  /** Grand total including shipping and GST */
  grandTotal = computed(() => {
    const sub = this.cartStore.subTotal();
    const discount = this.cartStore.cart().discountAmount ?? 0;
    const shipping = sub >= this.cartStore.freeShippingThreshold ? 0 : 49;
    const gst = sub * 0.05;
    return sub - discount + shipping + gst;
  });

  /** Progress toward free shipping threshold, capped at 100 */
  shippingProgressPct = computed(() => {
    const pct = (this.cartStore.subTotal() / this.cartStore.freeShippingThreshold) * 100;
    return Math.min(100, Math.round(pct));
  });

  updateQty(item: CartItem, quantity: number) {
    if (quantity < 1) {
      this.removeItem(item.variantSku);
      return;
    }
    this.cartStore.updateQuantity(item.variantSku, quantity).subscribe();
  }

  removeItem(sku: string) {
    this.cartStore.removeItem(sku).subscribe();
  }

  applyCoupon() {
    if (!this.couponCode.trim()) return;
    this.couponError.set('');

    this.cartStore.applyCoupon(this.couponCode.trim().toUpperCase()).subscribe({
      next: () => {
        this.couponCode = '';
      },
      error: (err) => {
        this.couponError.set(err.error?.message || 'Invalid coupon code. Please try again.');
      },
    });
  }

  removeCoupon() {
    this.cartStore.removeCoupon().subscribe();
  }

  proceedToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
