import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartStore } from '../../../state/cart.store';

@Component({
  selector: 'bb-cart-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Backdrop -->
    @if (cartStore.isOpen()) {
      <div
        class="fixed inset-0 z-40 animate-fade-in"
        style="background: rgba(45,45,45,0.45); backdrop-filter: blur(2px);"
        (click)="cartStore.closeDrawer()"
        aria-hidden="true"
      ></div>
    }

    <!-- Drawer -->
    <aside
      class="fixed top-0 right-0 z-50 h-full w-full max-w-md flex flex-col transition-transform duration-300 ease-out"
      style="background: white; box-shadow: -5px 0 40px rgba(0,0,0,0.10);"
      [class.translate-x-0]="cartStore.isOpen()"
      [class.translate-x-full]="!cartStore.isOpen()"
      aria-label="Shopping cart"
      [attr.aria-hidden]="!cartStore.isOpen()"
      role="dialog"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4" style="border-bottom: 1px solid var(--color-border);">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/>
            </svg>
            <h2 class="font-display font-bold text-lg" style="color: var(--color-text);">Shopping Cart</h2>
          </div>
          @if (cartStore.itemCount() > 0) {
            <span class="badge-primary text-xs">{{ cartStore.itemCount() }} items</span>
          }
        </div>
        <button
          (click)="cartStore.closeDrawer()"
          class="btn-icon"
          aria-label="Close cart"
          id="cart-drawer-close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Free Shipping Progress Bar -->
      @if (!cartStore.isEmpty()) {
        <div class="px-5 py-3" style="background: var(--color-bg-subtle); border-bottom: 1px solid var(--color-border);">
          @if (cartStore.remainingForFreeShipping() > 0) {
            <div class="text-xs mb-1.5 flex items-center gap-1.5" style="color: var(--color-text-muted);">
              <svg class="w-4 h-4 inline-block" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h5m4 0h5"/>
              </svg>
              <span>Add <strong style="color: var(--color-primary-dark);">₹{{ cartStore.remainingForFreeShipping() | number:'1.0-0' }}</strong> more for FREE shipping!</span>
            </div>
          } @else {
            <div class="text-xs text-green-600 font-semibold mb-1.5 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-green-600 inline-block animate-bounce-soft" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <span>You've unlocked FREE shipping!</span>
            </div>
          }
          <div class="h-1.5 rounded-full overflow-hidden" style="background: var(--color-border);">
            <div
              class="h-full rounded-full transition-all duration-500"
              style="background: var(--gradient-primary);"
              [style.width.%]="Math.min(100, (cartStore.subTotal() / 499) * 100)"
            ></div>
          </div>
        </div>
      }

      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        @if (cartStore.isEmpty()) {
          <div class="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
            <div class="w-20 h-20 rounded-full flex items-center justify-center" style="background: var(--color-primary-light);">
              <svg class="w-10 h-10" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/>
              </svg>
            </div>
            <div>
              <p class="font-semibold text-neutral-700">Your cart is empty</p>
              <p class="text-sm text-neutral-400 mt-1">Explore our collection and find something you love!</p>
            </div>
            <a routerLink="/products" (click)="cartStore.closeDrawer()" class="btn-primary text-sm">
              Start Shopping
            </a>
          </div>
        } @else {
          @for (item of cartStore.cart().items; track item.variantSku) {
            <div class="flex gap-3 py-3 animate-fade-in" style="border-bottom: 1px solid var(--color-border);">

              <!-- Product Image -->
              <a [routerLink]="['/products']" (click)="cartStore.closeDrawer()" class="flex-shrink-0">
                <img
                  [src]="item.image || '/assets/placeholder-product.jpg'"
                  [alt]="item.title"
                  class="w-20 h-24 object-cover rounded-xl"
                />
              </a>

              <!-- Item Details -->
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-sm text-neutral-800 truncate-2 leading-snug">
                  {{ item.title }}
                </h3>
                <div class="flex gap-2 mt-1">
                  @if (item.size) {
                    <span class="text-xs text-neutral-500 px-2 py-0.5 rounded" style="background: var(--color-bg-subtle);">{{ item.size }}</span>
                  }
                  @if (item.color) {
                    <span class="text-xs text-neutral-500 px-2 py-0.5 rounded" style="background: var(--color-bg-subtle);">{{ item.color }}</span>
                  }
                </div>

                <!-- Price -->
                <p class="font-bold text-sm mt-1.5" style="color: var(--color-primary-dark);">
                  ₹{{ item.price | number:'1.0-0' }}
                </p>

                <!-- Qty Controls + Remove -->
                <div class="flex items-center justify-between mt-2">
                  <div class="flex items-center rounded-lg overflow-hidden" style="border: 1px solid var(--color-border);">
                    <button
                      (click)="updateQty(item, item.quantity - 1)"
                      class="w-8 h-8 flex items-center justify-center transition-colors text-neutral-600 qty-btn"
                      [disabled]="item.quantity <= 1"
                      aria-label="Decrease quantity"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/>
                      </svg>
                    </button>
                    <span class="w-8 text-center text-sm font-semibold text-neutral-900">{{ item.quantity }}</span>
                    <button
                      (click)="updateQty(item, item.quantity + 1)"
                      class="w-8 h-8 flex items-center justify-center transition-colors text-neutral-600 qty-btn"
                      aria-label="Increase quantity"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                      </svg>
                    </button>
                  </div>

                  <button
                    (click)="removeItem(item.variantSku)"
                    class="text-neutral-400 hover:text-red-500 transition-colors"
                    aria-label="Remove item"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- Footer – Order Summary & Checkout -->
      @if (!cartStore.isEmpty()) {
        <div class="px-5 py-4 space-y-3" style="border-top: 1px solid var(--color-border); background: var(--color-bg-subtle);">
          <!-- Summary -->
          <div class="space-y-1.5">
            <div class="flex justify-between text-sm">
              <span class="text-neutral-500">Subtotal</span>
              <span class="font-medium text-neutral-800">₹{{ cartStore.subTotal() | number:'1.0-0' }}</span>
            </div>
            @if (cartStore.cart().discountAmount > 0) {
              <div class="flex justify-between text-sm">
                <span class="text-green-600">Discount ({{ cartStore.cart().couponCode }})</span>
                <span class="text-green-600 font-medium">-₹{{ cartStore.cart().discountAmount | number:'1.0-0' }}</span>
              </div>
            }
            <div class="flex justify-between text-sm">
              <span class="text-neutral-500">Shipping</span>
              <span class="font-medium" [style.color]="cartStore.subTotal() >= 499 ? 'var(--color-green)' : 'var(--color-text)'">
                {{ cartStore.subTotal() >= 499 ? 'FREE' : '₹49' }}
              </span>
            </div>
            <div class="divider"></div>
            <div class="flex justify-between">
              <span class="font-bold text-neutral-800">Total</span>
              <span class="font-bold text-lg" style="color: var(--color-primary-dark);">₹{{ cartStore.totalAmount() | number:'1.0-0' }}</span>
            </div>
          </div>

          <!-- CTA Buttons -->
          <a
            routerLink="/checkout"
            (click)="cartStore.closeDrawer()"
            class="btn-primary w-full text-base py-3.5"
            id="cart-checkout-btn"
          >
            Proceed to Checkout
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
          <a
            routerLink="/cart"
            (click)="cartStore.closeDrawer()"
            class="btn-secondary w-full text-sm py-2.5"
          >
            View Full Cart
          </a>
        </div>
      }
    </aside>
  `,
  styles: [`
    .qty-btn:hover:not(:disabled) {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }
  `]
})
export class CartDrawerComponent {
  readonly cartStore = inject(CartStore);
  readonly Math = Math;

  updateQty(item: any, qty: number) {
    if (qty < 1) return;
    this.cartStore.updateQuantity(item.variantSku, qty).subscribe();
  }

  removeItem(sku: string) {
    this.cartStore.removeItem(sku).subscribe();
  }
}
