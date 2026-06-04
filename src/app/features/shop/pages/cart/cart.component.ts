import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
    <div class="bb-container py-10 page-enter">
      <h1 class="text-3xl font-extrabold text-neutral-900 dark:text-white font-display mb-8">
        Your Shopping Cart
      </h1>

      @if (cartStore.loading() && cartStore.cart().items.length === 0) {
        <div class="space-y-6">
          <div class="skeleton h-20 w-full rounded-2xl"></div>
          <div class="skeleton h-20 w-full rounded-2xl"></div>
        </div>
      } @else if (cartStore.isEmpty()) {
        <!-- Empty State -->
        <div class="card p-12 text-center text-neutral-400 space-y-4 max-w-md mx-auto">
          <div class="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-neutral-800 dark:text-neutral-200">Your cart is empty</h3>
          <p class="text-sm">Explore our products and find something adorable for your little bliss!</p>
          <a routerLink="/products" class="btn-primary inline-block mt-4 py-3 px-8">Shop Now</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Cart Items -->
          <div class="lg:col-span-2 space-y-4">
            @for (item of cartStore.cart().items; track item.variantSku) {
              <div class="card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div class="flex items-center gap-4 w-full sm:w-auto">
                  <div class="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    <img [src]="item.image || '/assets/placeholder-product.jpg'" [alt]="item.title" class="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 class="font-bold text-sm text-neutral-800 dark:text-neutral-200">{{ item.title }}</h3>
                    <p class="text-xs text-neutral-400">SKU: {{ item.variantSku }}</p>
                    @if (item.size || item.color) {
                      <div class="flex gap-2 mt-1">
                        @if (item.size) {
                          <span class="text-[10px] bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded font-semibold text-neutral-600 dark:text-neutral-300">Size: {{ item.size }}</span>
                        }
                        @if (item.color) {
                          <span class="text-[10px] bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded font-semibold text-neutral-600 dark:text-neutral-300">Color: {{ item.color }}</span>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Price and Quantity Control -->
                <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div class="text-right">
                    <span class="font-bold text-base text-neutral-900 dark:text-white">
                      ₹{{ item.price | number:'1.0-0' }}
                    </span>
                    <span class="text-xs text-neutral-400 block">each</span>
                  </div>

                  <!-- Quantity Incrementor -->
                  <div class="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800">
                    <button (click)="updateQty(item, item.quantity - 1)" class="px-2.5 py-1 text-neutral-500 hover:bg-neutral-50" [disabled]="item.quantity <= 1">&minus;</button>
                    <span class="px-3 font-semibold text-xs text-neutral-800 dark:text-neutral-200">{{ item.quantity }}</span>
                    <button (click)="updateQty(item, item.quantity + 1)" class="px-2.5 py-1 text-neutral-500 hover:bg-neutral-50">+</button>
                  </div>

                  <!-- Remove Button -->
                  <button (click)="removeItem(item.variantSku)" class="text-red-500 hover:text-red-600 w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Right Column: Order Summary -->
          <div class="space-y-6">
            <div class="card p-6 space-y-4">
              <h2 class="font-bold text-lg text-neutral-900 dark:text-white border-b pb-3">Order Summary</h2>

              <div class="space-y-2 text-sm">
                <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span class="font-semibold text-neutral-900 dark:text-white">₹{{ cartStore.subTotal() | number:'1.0-0' }}</span>
                </div>

                @if (cartStore.cart().discountAmount > 0) {
                  <div class="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span class="font-semibold">-₹{{ cartStore.cart().discountAmount | number:'1.0-0' }}</span>
                  </div>
                }

                <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Shipping</span>
                  @if (cartStore.subTotal() >= cartStore.freeShippingThreshold) {
                    <span class="font-semibold text-emerald-600">FREE</span>
                  } @else {
                    <span class="font-semibold text-neutral-900 dark:text-white">₹49</span>
                  }
                </div>
              </div>

              <!-- Shipping threshold alert -->
              @if (cartStore.remainingForFreeShipping() > 0) {
                <div class="bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Add ₹{{ cartStore.remainingForFreeShipping() }} more for FREE Shipping!</span>
                </div>
              }

              <!-- Coupon Code Field -->
              <div class="border-t pt-4 space-y-2">
                <label class="block text-xs font-semibold text-neutral-400">Coupon Code</label>
                @if (cartStore.cart().couponCode) {
                  <div class="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 px-3 py-2 rounded-xl text-sm">
                    <span class="font-bold">{{ cartStore.cart().couponCode }} applied</span>
                    <button (click)="removeCoupon()" class="text-xs text-red-500 font-bold">Remove</button>
                  </div>
                } @else {
                  <div class="flex gap-2">
                    <input type="text" [(ngModel)]="couponCode" placeholder="FIRST10" class="input-field py-2" />
                    <button (click)="applyCoupon()" class="btn-secondary py-2.5 px-4 text-xs font-bold">Apply</button>
                  </div>
                  @if (couponError()) {
                    <p class="text-red-500 text-xs mt-1">{{ couponError() }}</p>
                  }
                }
              </div>

              <!-- Total amount -->
              <div class="border-t pt-4 flex justify-between items-baseline">
                <span class="font-bold text-base text-neutral-800 dark:text-neutral-200">Total</span>
                <span class="text-2xl font-black text-primary-600">
                  ₹{{ (cartStore.totalAmount() + (cartStore.subTotal() >= cartStore.freeShippingThreshold ? 0 : 49)) | number:'1.0-0' }}
                </span>
              </div>

              <!-- Checkout CTA -->
              <button (click)="proceedToCheckout()" class="btn-primary w-full py-4 text-sm font-bold shadow-pink mt-2">
                Proceed to Checkout
              </button>
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

  updateQty(item: CartItem, quantity: number) {
    if (quantity < 1) return;
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
        this.couponError.set(err.error?.message || 'Invalid coupon code');
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
