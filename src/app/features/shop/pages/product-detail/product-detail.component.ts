import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ProductService } from '../../../../core/services/product.service';
import { CartStore } from '../../../../state/cart.store';
import { WishlistStore } from '../../../../state/wishlist.store';
import { AuthStore } from '../../../../state/auth.store';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="bb-container py-8 page-enter">
      @if (loading()) {
        <!-- Skeleton Detail Loading -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="skeleton aspect-square rounded-3xl w-full"></div>
          <div class="space-y-4">
            <div class="skeleton h-8 w-3/4 rounded-lg"></div>
            <div class="skeleton h-5 w-1/4 rounded-lg"></div>
            <div class="skeleton h-20 w-full rounded-lg"></div>
            <div class="skeleton h-10 w-1/3 rounded-lg"></div>
          </div>
        </div>
      } @else if (error()) {
        <div class="card p-12 text-center text-red-500">
          <p>{{ error() }}</p>
          <a routerLink="/products" class="btn-primary mt-4 inline-block">Back to Products</a>
        </div>
      } @else {
        @if (product(); as p) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <!-- Left: Product Images -->
          <div class="space-y-4">
            <div class="relative overflow-hidden rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 aspect-square">
              <img
                [src]="activeImage() || '/assets/placeholder-product.jpg'"
                [alt]="p.title"
                class="w-full h-full object-cover animate-fade-in"
              />
            </div>
            <!-- Image Carousel/List -->
            @if (p.images?.length > 1) {
              <div class="flex gap-3 overflow-x-auto pb-2">
                @for (img of p.images; track img) {
                  <button
                    (click)="activeImage.set(img)"
                    [class.border-primary-500]="activeImage() === img"
                    [class.border-transparent]="activeImage() !== img"
                    class="w-20 h-20 rounded-xl overflow-hidden border-2 bg-neutral-100 flex-shrink-0"
                  >
                    <img [src]="img" class="w-full h-full object-cover" [alt]="p.title" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Right: Product Info -->
          <div class="space-y-6">
            <div>
              @if (p.categoryId?.name) {
                <span class="text-xs text-primary-500 font-semibold uppercase tracking-wider block mb-1">
                  {{ p.categoryId.name }}
                </span>
              }
              <h1 class="text-3xl font-extrabold text-neutral-900 dark:text-white font-display tracking-tight leading-tight">
                {{ p.title }}
              </h1>
              <p class="text-neutral-400 text-xs mt-1">SKU: {{ selectedVariant()?.sku || p.sku }}</p>
            </div>

            <!-- Price and Rating -->
            <div class="flex items-center justify-between border-y py-4 border-neutral-100 dark:border-neutral-800">
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-extrabold text-neutral-900 dark:text-white">
                  ₹{{ (selectedVariant()?.price || p.discountPrice || p.price) | number:'1.0-0' }}
                </span>
                @if (p.discountPrice && p.discountPrice < p.price && !selectedVariant()?.price) {
                  <span class="price-original text-lg">₹{{ p.price | number:'1.0-0' }}</span>
                  <span class="text-emerald-500 text-sm font-semibold">
                    ({{ Math.round(((p.price - p.discountPrice) / p.price) * 100) }}% OFF)
                  </span>
                }
              </div>

              <!-- Star Rating -->
              <div class="flex items-center gap-1">
                <div class="flex">
                  @for (star of [1,2,3,4,5]; track star) {
                    <svg class="w-4 h-4" [class]="star <= Math.round(p.rating || 0) ? 'star-filled' : 'star-empty'" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  }
                </div>
                <span class="text-xs text-neutral-500 font-medium">({{ reviews().length }} reviews)</span>
              </div>
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Product Info</h3>
              <p class="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">{{ p.description || p.shortDescription }}</p>
            </div>

            <!-- Variants Selector -->
            @if (p.variants?.length > 0) {
              <div class="space-y-4">
                <!-- Size Picker -->
                @if (availableSizes().length > 0) {
                  <div>
                    <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider mb-2">Select Size</h3>
                    <div class="flex flex-wrap gap-2">
                      @for (size of availableSizes(); track size) {
                        <button
                          (click)="selectSize(size)"
                          [class.bg-neutral-900]="selectedSize() === size"
                          [class.text-white]="selectedSize() === size"
                          [class.border-neutral-900]="selectedSize() === size"
                          [class.bg-white]="selectedSize() !== size"
                          [class.text-neutral-800]="selectedSize() !== size"
                          [class.dark:bg-neutral-800]="selectedSize() !== size"
                          [class.dark:text-neutral-200]="selectedSize() !== size"
                          class="px-4 py-2 border rounded-xl text-sm font-semibold hover:border-neutral-900 transition-colors"
                        >
                          {{ size }}
                        </button>
                      }
                    </div>
                  </div>
                }

                <!-- Color Picker -->
                @if (availableColors().length > 0) {
                  <div>
                    <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider mb-2">Select Color</h3>
                    <div class="flex flex-wrap gap-3">
                      @for (color of availableColors(); track color.name) {
                        <button
                          (click)="selectColor(color.name)"
                          [title]="color.name"
                          [class.ring-2]="selectedColor() === color.name"
                          [class.ring-primary-500]="selectedColor() === color.name"
                          [class.ring-offset-2]="selectedColor() === color.name"
                          class="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center relative hover:scale-105 transition-transform"
                          [style.background-color]="color.hex || '#ccc'"
                        >
                          @if (selectedColor() === color.name) {
                            <span class="w-2.5 h-2.5 rounded-full bg-white shadow-sm"></span>
                          }
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Quantity & Actions -->
            <div class="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <div class="flex items-center gap-4">
                <div class="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-800">
                  <button (click)="decreaseQty()" class="px-3 py-2 text-neutral-500 hover:bg-neutral-50">&minus;</button>
                  <span class="px-4 font-bold text-sm text-neutral-800 dark:text-neutral-200">{{ quantity() }}</span>
                  <button (click)="increaseQty()" class="px-3 py-2 text-neutral-500 hover:bg-neutral-50">&plus;</button>
                </div>

                <div class="flex-1 flex gap-2">
                  <button
                    [disabled]="selectedVariantStock() === 0"
                    (click)="addToCart()"
                    class="btn-primary flex-1 py-3 px-6 shadow-md"
                  >
                    @if (selectedVariantStock() === 0) {
                      Out of Stock
                    } @else {
                      Add to Cart
                    }
                  </button>

                  @if (authStore.isLoggedIn()) {
                    <button
                      (click)="toggleWishlist()"
                      [class.text-red-500]="isWishlisted()"
                      [class.bg-red-50]="isWishlisted()"
                      class="btn-icon"
                    >
                      <svg class="w-5 h-5" [attr.fill]="isWishlisted() ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                      </svg>
                    </button>
                  }
                </div>
              </div>

              <!-- Stock Alert info -->
              @if (selectedVariant(); as v) {
                <p class="text-xs font-semibold" [class.text-red-500]="v.stock <= 5" [class.text-neutral-400]="v.stock > 5">
                  @if (v.stock === 0) {
                    Temporarily sold out.
                  } @else if (v.stock <= 5) {
                    Only {{ v.stock }} units left! Order fast.
                  } @else {
                    Item is in stock and ready to ship.
                  }
                </p>
              }
            </div>

            <!-- Material & Details -->
            <div class="border-t pt-4 border-neutral-100 dark:border-neutral-800 grid grid-cols-2 gap-4 text-xs">
              @if (p.material) {
                <div>
                  <span class="text-neutral-400 block mb-0.5 font-medium">Material</span>
                  <span class="text-neutral-800 dark:text-neutral-200 font-semibold">{{ p.material }}</span>
                </div>
              }
              @if (p.careInstructions) {
                <div>
                  <span class="text-neutral-400 block mb-0.5 font-medium">Care Instructions</span>
                  <span class="text-neutral-800 dark:text-neutral-200 font-semibold">{{ p.careInstructions }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Section: Reviews & Customer Feedback -->
        <section class="mt-16 border-t pt-10 border-neutral-100 dark:border-neutral-800">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Review overview / ratings breakdown -->
            <div class="col-span-1 space-y-6">
              <h2 class="text-2xl font-bold text-neutral-900 dark:text-white font-display">Customer Reviews</h2>
              <div class="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-850 p-6 rounded-2xl">
                <div class="text-center">
                  <div class="text-4xl font-extrabold text-neutral-900 dark:text-white">{{ p.rating | number:'1.1-1' }}</div>
                  <div class="text-xs text-neutral-400 mt-1">out of 5</div>
                </div>
                <div class="flex-1 space-y-1">
                  <div class="flex items-center gap-1.5">
                    <div class="flex">
                      @for (star of [1,2,3,4,5]; track star) {
                        <svg class="w-3.5 h-3.5" [class]="star <= Math.round(p.rating || 0) ? 'star-filled' : 'star-empty'" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      }
                    </div>
                    <span class="text-xs text-neutral-500 font-semibold">{{ reviews().length }} ratings total</span>
                  </div>
                </div>
              </div>

              <!-- Leave a Review Form (If Logged In) -->
              @if (authStore.isLoggedIn()) {
                <div class="card p-6 space-y-4">
                  <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Write a Review</h3>
                  <form [formGroup]="reviewForm" (ngSubmit)="submitReview()" class="space-y-3">
                    <div>
                      <label class="block text-xs font-semibold text-neutral-400 mb-1">Rating</label>
                      <select formControlName="rating" class="input-field py-2">
                        <option value="5">5 Stars (Excellent)</option>
                        <option value="4">4 Stars (Good)</option>
                        <option value="3">3 Stars (Average)</option>
                        <option value="2">2 Stars (Poor)</option>
                        <option value="1">1 Star (Very Poor)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-neutral-400 mb-1">Comment</label>
                      <textarea formControlName="comment" rows="3" placeholder="Tell us about the fabric, fit, and style..." class="input-field"></textarea>
                    </div>
                    <button type="submit" [disabled]="reviewForm.invalid || submittingReview()" class="btn-primary w-full py-2.5 text-xs">
                      Submit Review
                    </button>
                  </form>
                </div>
              } @else {
                <p class="text-xs text-neutral-400">Please <a routerLink="/auth/login" class="text-primary-500 font-semibold hover:underline">sign in</a> to leave a review.</p>
              }
            </div>

            <!-- Review list details -->
            <div class="col-span-1 lg:col-span-2 space-y-6">
              @if (reviews().length === 0) {
                <div class="card p-8 text-center text-neutral-400">
                  <p class="text-sm">No reviews yet for this product. Be the first to share your feedback!</p>
                </div>
              } @else {
                <div class="space-y-4">
                  @for (rev of reviews(); track rev._id) {
                    <div class="card p-5 space-y-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs">
                            {{ rev.userId?.firstName?.charAt(0) || 'U' }}
                          </div>
                          <div>
                            <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                              {{ rev.userId?.firstName }} {{ rev.userId?.lastName }}
                            </div>
                            <div class="text-[10px] text-neutral-400">{{ rev.createdAt | date:'mediumDate' }}</div>
                          </div>
                        </div>

                        <!-- Stars -->
                        <div class="flex">
                          @for (star of [1,2,3,4,5]; track star) {
                            <svg class="w-3.5 h-3.5" [class]="star <= rev.rating ? 'star-filled' : 'star-empty'" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          }
                        </div>
                      </div>

                      <p class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
                        "{{ rev.comment }}"
                      </p>

                      @if (rev.isVerifiedPurchase) {
                        <div class="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                          </svg>
                          Verified Purchase
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </section>
        }
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private productService = inject(ProductService);
  private cartStore = inject(CartStore);
  private wishlistStore = inject(WishlistStore);
  readonly authStore = inject(AuthStore);
  private cdr = inject(ChangeDetectorRef);

  private routeSub!: Subscription;

  product = signal<any | null>(null);
  reviews = signal<any[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Active Image & Quantities
  activeImage = signal<string>('');
  quantity = signal<number>(1);

  // Variants Selectors
  availableSizes = signal<string[]>([]);
  availableColors = signal<{ name: string; hex: string }[]>([]);
  selectedSize = signal<string | null>(null);
  selectedColor = signal<string | null>(null);
  selectedVariant = signal<any | null>(null);

  // Forms
  reviewForm = this.fb.group({
    rating: ['5', [Validators.required]],
    comment: ['', [Validators.required, Validators.minLength(5)]],
  });
  submittingReview = signal<boolean>(false);

  readonly Math = Math;

  ngOnInit() {
    this.routeSub = this.route.params.subscribe((params) => {
      const slug = params['slug'];
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  loadProduct(slug: string) {
    this.loading.set(true);
    this.error.set(null);
    this.cdr.markForCheck();

    this.productService.getBySlug(slug).subscribe({
      next: (res: any) => {
        const prod = res.data;
        this.product.set(prod);
        if (prod.images?.length > 0) {
          this.activeImage.set(prod.images[0]);
        }

        // Setup variants
        if (prod.variants?.length > 0) {
          const sizesSet = new Set<string>();
          const colorsMap = new Map<string, string>();
          prod.variants.forEach((v: any) => {
            if (v.size) sizesSet.add(v.size);
            if (v.color) colorsMap.set(v.color, v.colorHex || '#ccc');
          });

          this.availableSizes.set(Array.from(sizesSet));
          const colorList = Array.from(colorsMap.entries()).map(([name, hex]) => ({ name, hex }));
          this.availableColors.set(colorList);

          // Select first variant as default
          const defaultVariant = prod.variants[0];
          this.selectedVariant.set(defaultVariant);
          if (defaultVariant.size) this.selectedSize.set(defaultVariant.size);
          if (defaultVariant.color) this.selectedColor.set(defaultVariant.color);
        }

        this.loading.set(false);
        this.loadReviews(prod._id || prod.id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error.set('Failed to load product details.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  loadReviews(productId: string) {
    this.http.get<any>(`${environment.apiUrl}/reviews/product/${productId}`).subscribe({
      next: (res) => {
        this.reviews.set(res.data || []);
        this.cdr.markForCheck();
      },
    });
  }

  isWishlisted(): boolean {
    const prod = this.product();
    if (!prod) return false;
    return this.wishlistStore.isInWishlist(prod._id || prod.id);
  }

  toggleWishlist() {
    const prod = this.product();
    if (!prod) return;
    this.wishlistStore.toggle(prod._id || prod.id).subscribe();
  }

  selectSize(size: string) {
    this.selectedSize.set(size);
    this.resolveVariant();
  }

  selectColor(color: string) {
    this.selectedColor.set(color);
    this.resolveVariant();
  }

  resolveVariant() {
    const prod = this.product();
    if (!prod || !prod.variants) return;

    const size = this.selectedSize();
    const color = this.selectedColor();

    const variant = prod.variants.find((v: any) => {
      const matchSize = !size || v.size === size;
      const matchColor = !color || v.color === color;
      return matchSize && matchColor;
    });

    if (variant) {
      this.selectedVariant.set(variant);
      if (variant.image) this.activeImage.set(variant.image);
    }
  }

  selectedVariantStock(): number {
    const v = this.selectedVariant();
    if (v) return v.stock;
    const prod = this.product();
    return prod ? prod.stock || 10 : 0;
  }

  increaseQty() {
    const max = this.selectedVariantStock();
    if (this.quantity() < max) {
      this.quantity.update((q) => q + 1);
    }
  }

  decreaseQty() {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  addToCart() {
    const prod = this.product();
    if (!prod) return;

    const variant = this.selectedVariant();
    const sku = variant ? variant.sku : prod.sku;

    this.cartStore.addItem(prod._id || prod.id, sku, this.quantity()).subscribe();
  }

  submitReview() {
    if (this.reviewForm.invalid) return;
    this.submittingReview.set(true);

    const prod = this.product();
    const payload = {
      productId: prod._id || prod.id,
      rating: Number(this.reviewForm.value.rating),
      comment: this.reviewForm.value.comment,
    };

    this.http.post<any>(`${environment.apiUrl}/reviews`, payload).subscribe({
      next: (res) => {
        this.submittingReview.set(false);
        this.reviewForm.reset({ rating: '5', comment: '' });
        this.loadReviews(prod._id || prod.id);
        this.cdr.markForCheck();
      },
      error: () => {
        this.submittingReview.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
