import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { WishlistStore } from '../../../../state/wishlist.store';
import { CartStore } from '../../../../state/cart.store';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-wishlist-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="card p-6 space-y-6 page-enter">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">My Wishlist</h2>
          <p class="text-neutral-500 text-xs mt-1">Saved items you plan to buy later</p>
        </div>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          @for (s of [1,2,3]; track s) {
            <div class="skeleton aspect-[3/4] w-full rounded-2xl"></div>
          }
        </div>
      } @else if (products().length === 0) {
        <div class="text-center py-12 text-neutral-400 space-y-3">
          <div class="w-12 h-12 bg-neutral-50 dark:bg-neutral-800 text-neutral-300 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </div>
          <h4 class="font-bold text-sm text-neutral-750">Your wishlist is empty</h4>
          <p class="text-xs max-w-xs mx-auto">Add items to your wishlist while browsing to save them here.</p>
          <a routerLink="/products" class="btn-primary py-2.5 px-6 text-xs inline-block mt-2">Explore Products</a>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-6">
          @for (p of products(); track p.id || p._id) {
            <div class="relative bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
              <!-- Delete/Remove button -->
              <button
                (click)="removeFromWishlist(p.id || p._id)"
                class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-red-500 hover:scale-105 transition-transform shadow-xs z-10"
                aria-label="Remove from wishlist"
              >
                <i class="pi pi-times"></i>
              </button>

              <a [routerLink]="['/products', p.slug]" class="block relative aspect-[4/5] bg-neutral-50 dark:bg-neutral-900">
                <img [src]="p.images?.[0]" class="w-full h-full object-cover" [alt]="p.title" />
              </a>

              <div class="p-4 space-y-2">
                <a [routerLink]="['/products', p.slug]" class="block">
                  <h4 class="font-bold text-xs text-neutral-800 dark:text-neutral-250 truncate">{{ p.title }}</h4>
                </a>
                <div class="flex justify-between items-baseline">
                  <span class="text-sm font-extrabold text-neutral-900 dark:text-white">₹{{ (p.discountPrice || p.price) | number:'1.0-0' }}</span>
                  @if (p.discountPrice && p.discountPrice < p.price) {
                    <span class="text-[10px] text-neutral-400 line-through">₹{{ p.price | number:'1.0-0' }}</span>
                  }
                </div>

                <button (click)="moveToCart(p)" class="btn-primary w-full py-2 text-xs font-semibold">
                  Add to Cart
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class WishlistComponent implements OnInit {
  private http = inject(HttpClient);
  private wishlistStore = inject(WishlistStore);
  private cartStore = inject(CartStore);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  products = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.fetchWishlist();
  }

  fetchWishlist() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/wishlist`).subscribe({
      next: (res) => {
        this.products.set(res.data?.products || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  removeFromWishlist(productId: string) {
    this.wishlistStore.toggle(productId).subscribe(() => {
      this.products.update((list) => list.filter((p) => (p.id || p._id) !== productId));
      this.cdr.markForCheck();
    });
  }

  moveToCart(product: any) {
    if (product.variants?.length > 1) {
      this.router.navigate(['/products', product.slug]);
      return;
    }
    const defaultVariant = product.variants?.[0];
    const sku = defaultVariant ? defaultVariant.sku : product.sku;

    this.cartStore.addItem(product.id || product._id, sku, 1).subscribe(() => {
      // Cleanly remove from wishlist on move to cart
      this.removeFromWishlist(product.id || product._id);
    });
  }
}
