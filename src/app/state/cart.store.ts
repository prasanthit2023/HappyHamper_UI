import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal, computed } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from '../core/services/toast.service';

export interface CartItem {
  productId: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  variantSku: string;
  size?: string;
  color?: string;
}

export interface Cart {
  items: CartItem[];
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  // ── Signals ──────────────────────────────────────
  readonly cart      = signal<Cart>({ items: [], subTotal: 0, discountAmount: 0, totalAmount: 0 });
  readonly loading   = signal(false);
  readonly isOpen    = signal(false); // Cart drawer open state

  // ── Computed ──────────────────────────────────────
  readonly itemCount  = computed(() => this.cart().items.reduce((sum, i) => sum + i.quantity, 0));
  readonly isEmpty    = computed(() => this.cart().items.length === 0);
  readonly subTotal   = computed(() => this.cart().subTotal);
  readonly totalAmount = computed(() => this.cart().totalAmount);
  readonly freeShippingThreshold = 499;
  readonly remainingForFreeShipping = computed(() =>
    Math.max(0, this.freeShippingThreshold - this.subTotal()),
  );

  private readonly toastService = inject(ToastService);

  constructor(private http: HttpClient) {}

  // ── Fetch Cart ───────────────────────────────────
  loadCart() {
    this.loading.set(true);
    return this.http.get<{ data: Cart }>(`${environment.apiUrl}/cart`).pipe(
      tap((res) => {
        this.cart.set(res.data);
        this.loading.set(false);
      }),
    );
  }

  // ── Add Item ─────────────────────────────────────
  addItem(productId: string, variantSku: string, quantity = 1) {
    this.loading.set(true);
    return this.http
      .post<{ data: Cart }>(`${environment.apiUrl}/cart/items`, { productId, variantSku, quantity })
      .pipe(
        tap((res) => {
          this.cart.set(res.data);
          this.loading.set(false);
          this.openDrawer();
          this.toastService.success('Added to cart!');
        }),
      );
  }

  // ── Update Quantity ───────────────────────────────
  updateQuantity(variantSku: string, quantity: number) {
    // Optimistic update
    this.cart.update((c) => ({
      ...c,
      items: c.items.map((i) => (i.variantSku === variantSku ? { ...i, quantity } : i)),
    }));
    return this.http
      .put<{ data: Cart }>(`${environment.apiUrl}/cart/items/${variantSku}`, { quantity })
      .pipe(tap((res) => this.cart.set(res.data)));
  }

  // ── Remove Item ───────────────────────────────────
  removeItem(variantSku: string) {
    this.cart.update((c) => ({ ...c, items: c.items.filter((i) => i.variantSku !== variantSku) }));
    this.toastService.info('Item removed from cart');
    return this.http
      .delete<{ data: Cart }>(`${environment.apiUrl}/cart/items/${variantSku}`)
      .pipe(tap((res) => this.cart.set(res.data)));
  }

  // ── Apply Coupon ──────────────────────────────────
  applyCoupon(code: string) {
    return this.http
      .post<{ discountAmount: number; message: string }>(`${environment.apiUrl}/cart/coupon`, { couponCode: code })
      .pipe(
        tap((res) => {
          this.cart.update((c) => ({
            ...c,
            couponCode: code,
            discountAmount: res.discountAmount,
            totalAmount: c.subTotal - res.discountAmount,
          }));
          this.toastService.success('Coupon applied successfully!');
        }),
        catchError((err) => {
          const msg = err?.error?.message || 'Invalid or expired coupon code';
          this.toastService.error(msg);
          return throwError(() => err);
        }),
      );
  }

  removeCoupon() {
    return this.http.delete(`${environment.apiUrl}/cart/coupon`).pipe(
      tap(() => {
        this.cart.update((c) => ({
          ...c,
          couponCode: undefined,
          discountAmount: 0,
          totalAmount: c.subTotal,
        }));
      }),
    );
  }

  // ── Drawer Controls ───────────────────────────────
  openDrawer()  { this.isOpen.set(true);  }
  closeDrawer() { this.isOpen.set(false); }
  toggleDrawer() { this.isOpen.update((v) => !v); }

  // ── Clear (after order) ───────────────────────────
  clearCart() {
    this.cart.set({ items: [], subTotal: 0, discountAmount: 0, totalAmount: 0 });
  }
}
