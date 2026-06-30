import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartStore } from '../../../state/cart.store';
import { WishlistStore } from '../../../state/wishlist.store';
import { AuthStore } from '../../../state/auth.store';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'bb-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    @if (viewMode === 'grid') {
      <div class="card-product group relative">

        <!-- Product Image -->
        <a [routerLink]="['/products', product.slug]" class="block relative overflow-hidden aspect-[3/4]" style="aspect-ratio: 3/4;" [attr.aria-label]="product.title">

          <!-- Badges on top-left (stacked to prevent overlap with heart button) -->
          <div class="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start pointer-events-none">
            <!-- Discount badge -->
            @if (discountPct > 0) {
              <span class="badge-discount text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm">
                -{{ discountPct }}%
              </span>
            }

            <!-- New badge -->
            @if (product.isNewArrival) {
              <span class="badge text-xs px-2.5 py-1 text-white font-bold rounded-lg shadow-sm" style="background: var(--color-primary);">New</span>
            }

            <!-- Best Seller badge (Popular) -->
            @if (product.isBestSeller) {
              <span class="badge text-xs px-2.5 py-1 flex items-center gap-1 font-bold shadow-sm text-white rounded-lg" style="background: var(--gradient-accent);">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                Popular
              </span>
            }
          </div>

          <!-- Image -->
          <img
            [src]="product.images?.[0] || '/assets/placeholder-product.jpg'"
            [alt]="product.title"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </a>



        <!-- Product Info -->
        <div class="p-4">
          <!-- Category -->
          @if (product.categoryId?.name) {
            <p class="text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color: var(--color-primary);">
              {{ product.categoryId.name }}
            </p>
          }

          <!-- Title -->
          <a [routerLink]="['/products', product.slug]" class="block">
            <h3 class="font-semibold text-sm text-neutral-800 truncate-2 leading-snug transition-colors product-title-link">
              {{ product.title }}
            </h3>
          </a>

          <!-- Rating -->
          <div class="flex items-center gap-1.5 mt-1.5">
            <div class="flex">
              @for (star of [1,2,3,4,5]; track star) {
                <svg class="w-3.5 h-3.5" [class]="star <= Math.round(product.rating || 0) ? 'star-filled' : 'star-empty'" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              }
            </div>
            <span class="text-xs text-neutral-400">({{ product.reviewCount || 0 }})</span>
          </div>

          <!-- Price Row -->
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-baseline gap-1.5">
              <span class="price-current">
                ₹{{ (product.discountPrice || product.price) | number:'1.0-0' }}
              </span>
              @if (product.discountPrice && product.discountPrice < product.price) {
                <span class="price-original">₹{{ product.price | number:'1.0-0' }}</span>
              }
            </div>

            <!-- Action buttons (Wishlist & Add grouped) -->
            <div class="flex items-center gap-2">
              <!-- Wishlist Button -->
              <button
                (click)="onToggleWishlist($event)"
                class="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                [style.color]="isWishlisted ? 'var(--color-pink)' : '#9CA3AF'"
                [style.background]="isWishlisted ? '#FDF2F8' : 'white'"
                [attr.aria-label]="isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'"
                [attr.id]="'wishlist-' + (product._id || product.id)"
              >
                <i [class]="isWishlisted ? 'pi pi-heart-fill text-xs' : 'pi pi-heart text-xs'"></i>
              </button>

              <!-- Add to cart quick button -->
              <button
                (click)="onQuickAdd($event)"
                class="w-8 h-8 rounded-full border border-transparent flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-warm"
                style="background: var(--color-primary-light); color: var(--color-primary);"
                [attr.aria-label]="'Add ' + product.title + ' to cart'"
              >
                <i class="pi pi-plus text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <!-- List View Mode Layout -->
      <div class="card p-4 flex flex-row gap-4 transition-shadow relative group overflow-hidden border border-neutral-100 bg-white rounded-2xl w-full">
        <!-- Product Image -->
        <a [routerLink]="['/products', product.slug]" class="block relative overflow-hidden w-28 sm:w-36 h-28 sm:h-36 rounded-xl flex-shrink-0 bg-neutral-50" [attr.aria-label]="product.title">
          <!-- Discount badge -->
          @if (discountPct > 0) {
            <span class="absolute top-2 left-2 z-10 badge-discount text-[10px] px-2 py-0.5 rounded font-bold shadow-sm">
              -{{ discountPct }}%
            </span>
          }

          <img
            [src]="product.images?.[0] || '/assets/placeholder-product.jpg'"
            [alt]="product.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </a>



        <!-- Product Info -->
        <div class="flex-1 flex flex-col justify-between py-1 min-w-0 pr-8 sm:pr-0">
          <div>
            @if (product.categoryId?.name) {
              <p class="text-xs font-semibold mb-1 uppercase tracking-wide" style="color: var(--color-primary);">
                {{ product.categoryId.name }}
              </p>
            }

            <a [routerLink]="['/products', product.slug]" class="block">
              <h3 class="font-bold text-sm sm:text-base text-neutral-800 line-clamp-1 hover:text-primary transition-colors">
                {{ product.title }}
              </h3>
            </a>

            <!-- Description -->
            <p class="text-xs text-neutral-400 mt-1 line-clamp-2 hidden sm:block leading-relaxed">
              {{ product.shortDescription || product.description }}
            </p>

            <div class="flex items-center gap-1.5 mt-1.5">
              <div class="flex">
                @for (star of [1,2,3,4,5]; track star) {
                  <svg class="w-3.5 h-3.5" [class]="star <= Math.round(product.rating || 0) ? 'star-filled' : 'star-empty'" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                }
              </div>
              <span class="text-xs text-neutral-400">({{ product.reviewCount || 0 }})</span>
            </div>
          </div>

          <div class="flex items-center justify-between mt-3">
            <div class="flex items-baseline gap-1.5">
              <span class="price-current text-base sm:text-lg">
                ₹{{ (product.discountPrice || product.price) | number:'1.0-0' }}
              </span>
              @if (product.discountPrice && product.discountPrice < product.price) {
                <span class="price-original text-xs sm:text-sm">₹{{ product.price | number:'1.0-0' }}</span>
              }
            </div>

            <!-- Action buttons (Wishlist & Add grouped) -->
            <div class="flex items-center gap-2">
              <!-- Wishlist Button -->
              <button
                (click)="onToggleWishlist($event)"
                class="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                [style.color]="isWishlisted ? 'var(--color-pink)' : '#9CA3AF'"
                [style.background]="isWishlisted ? '#FDF2F8' : 'white'"
                [attr.aria-label]="isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'"
                [attr.id]="'wishlist-' + (product._id || product.id)"
              >
                <i [class]="isWishlisted ? 'pi pi-heart-fill text-xs' : 'pi pi-heart text-xs'"></i>
              </button>

              <button
                (click)="onQuickAdd($event)"
                class="btn-primary text-xs py-1.5 px-3.5 shadow-sm rounded-lg flex items-center gap-1.5"
              >
                <i class="pi pi-shopping-cart text-[10px]"></i>
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .product-title-link:hover {
      color: var(--color-primary);
    }
  `]
})
export class ProductCardComponent {
  @Input({ required: true }) product!: any;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Output() quickAdd       = new EventEmitter<any>();
  @Output() wishlistToggle = new EventEmitter<string>();

  readonly authStore     = inject(AuthStore);
  readonly wishlistStore = inject(WishlistStore);
  private toastService   = inject(ToastService);
  private router         = inject(Router);

  readonly Math = Math;

  get isWishlisted(): boolean {
    return this.wishlistStore.isInWishlist(this.product._id || this.product.id);
  }

  get discountPct(): number {
    if (this.product.discountPrice && this.product.discountPrice < this.product.price) {
      return Math.round(((this.product.price - this.product.discountPrice) / this.product.price) * 100);
    }
    return 0;
  }

  onQuickAdd(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.quickAdd.emit(this.product);
  }

  onToggleWishlist(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.authStore.isLoggedIn()) {
      this.toastService.warning('Please log in to add items to your wishlist.');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.wishlistStore.toggle(this.product._id || this.product.id).subscribe();
  }
}
