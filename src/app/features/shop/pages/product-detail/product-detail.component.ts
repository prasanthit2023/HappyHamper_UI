import {
  Component, OnInit, OnDestroy, signal, inject, computed,
  ChangeDetectionStrategy, ChangeDetectorRef, HostListener, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { ProductService } from '../../../../core/services/product.service';
import { CartStore } from '../../../../state/cart.store';
import { WishlistStore } from '../../../../state/wishlist.store';
import { AuthStore } from '../../../../state/auth.store';
import { RecentlyViewedService } from '../../../../core/services/recently-viewed.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  styles: [`
    /* Image Zoom on Hover */
    .product-image-zoom {
      transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      will-change: transform;
    }
    .product-image-zoom:hover {
      transform: scale(1.08);
    }

    /* Thumbnail active border using CSS var */
    .thumb-active {
      border-color: var(--color-primary) !important;
      box-shadow: 0 0 0 2px var(--color-primary);
    }

    /* Trust badge */
    .trust-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 10px;
      background: var(--color-bg-subtle);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      flex: 1;
      min-width: 0;
      text-align: center;
    }
    .trust-badge svg {
      color: var(--color-primary);
    }
    .trust-badge span {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-text);
      line-height: 1.3;
    }

    /* Accordion */
    .accordion-body {
      overflow: hidden;
      max-height: 0;
      transition: max-height 0.35s ease, padding 0.2s ease;
    }
    .accordion-body.open {
      max-height: 500px;
    }

    /* Stock bar */
    .stock-bar-track {
      height: 6px;
      background: var(--color-border);
      border-radius: 99px;
      overflow: hidden;
    }
    .stock-bar-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 0.4s ease;
    }

    /* Sticky cart bar */
    .sticky-cart-bar {
      position: fixed;
      bottom: -80px;
      left: 0;
      right: 0;
      z-index: 50;
      transition: bottom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      background: white;
      border-top: 1px solid var(--color-border);
      box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
    }
    .sticky-cart-bar.visible {
      bottom: 0;
    }

    /* Related products horizontal scroll */
    .related-scroll {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 12px;
      scrollbar-width: thin;
      scrollbar-color: var(--color-border) transparent;
    }
    .related-scroll::-webkit-scrollbar {
      height: 5px;
    }
    .related-scroll::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: 99px;
    }
    .related-card {
      flex-shrink: 0;
      width: 188px;
      border-radius: 16px;
      border: 1px solid var(--color-border);
      overflow: hidden;
      background: white;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .related-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    }
    .related-card img {
      width: 100%;
      height: 140px;
      object-fit: cover;
    }
    .related-card .related-card-body {
      padding: 10px 12px;
    }

    /* Color chip selected ring */
    .color-chip-selected {
      ring: 2px var(--color-primary);
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    /* Breadcrumb */
    .breadcrumb-item {
      color: var(--color-text-muted);
      font-size: 12px;
    }
    .breadcrumb-item:hover {
      color: var(--color-primary);
    }
    .breadcrumb-sep {
      color: var(--color-border);
      font-size: 12px;
    }
  `],
  template: `
    <!-- ────────────────────────────────────────────────────────────── -->
    <!--  PAGE CONTAINER                                               -->
    <!-- ────────────────────────────────────────────────────────────── -->
    <div class="bb-container py-6 page-enter">

      <!-- ── LOADING SKELETON ── -->
      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="skeleton aspect-square rounded-3xl w-full"></div>
          <div class="space-y-4">
            <div class="skeleton h-5 w-1/3 rounded-lg"></div>
            <div class="skeleton h-8 w-3/4 rounded-lg"></div>
            <div class="skeleton h-5 w-1/4 rounded-lg"></div>
            <div class="skeleton h-20 w-full rounded-lg"></div>
            <div class="skeleton h-12 w-full rounded-xl"></div>
          </div>
        </div>
      }

      <!-- ── ERROR STATE ── -->
      @else if (error()) {
        <div class="card p-12 text-center" style="color:#ef4444">
          <p>{{ error() }}</p>
          <a routerLink="/products" class="btn-primary mt-4 inline-block">Back to Products</a>
        </div>
      }

      <!-- ── PRODUCT LOADED ── -->
      @else {
        @if (product(); as p) {

          <!-- ══ BREADCRUMB ══ -->
          <nav class="flex items-center gap-1.5 mb-6" aria-label="Breadcrumb">
            <a routerLink="/" class="breadcrumb-item hover-lift">Home</a>
            <span class="breadcrumb-sep">›</span>
            @if (p.categoryId?.name) {
              <a [routerLink]="['/products']" [queryParams]="{category: p.categoryId?._id}"
                 class="breadcrumb-item hover-lift">{{ p.categoryId.name }}</a>
              <span class="breadcrumb-sep">›</span>
            }
            <span class="breadcrumb-item font-semibold" style="color:var(--color-text)"
                  aria-current="page">{{ p.title }}</span>
          </nav>

          <!-- ══ MAIN GRID: image + info ══ -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">

            <!-- ─────────────── LEFT: Product Images ─────────────── -->
            <div class="space-y-4">
              <!-- Main image with zoom -->
              <div #mainImageWrapper
                   class="relative overflow-hidden rounded-3xl border bg-neutral-50 aspect-square"
                   style="border-color:var(--color-border)">
                <img
                  [src]="activeImage() || '/assets/placeholder-product.jpg'"
                  [alt]="p.title"
                  class="w-full h-full object-cover animate-fade-in product-image-zoom"
                />
                <!-- Discount badge overlay -->
                @if (p.discountPrice && p.discountPrice < p.price && !selectedVariant()?.price) {
                  <div class="absolute top-4 left-4">
                    <span class="badge badge-discount">
                      {{ Math.round(((p.price - p.discountPrice) / p.price) * 100) }}% OFF
                    </span>
                  </div>
                }
              </div>

              <!-- Thumbnail strip -->
              @if (p.images?.length > 1) {
                <div class="flex gap-3 overflow-x-auto pb-2">
                  @for (img of p.images; track img) {
                    <button
                      (click)="setActiveImage(img)"
                      [class.thumb-active]="activeImage() === img"
                      class="w-20 h-20 rounded-xl overflow-hidden border-2 border-transparent bg-neutral-100 flex-shrink-0 transition-all duration-200"
                      [attr.aria-label]="'View image ' + ($index + 1)"
                    >
                      <img [src]="img" class="w-full h-full object-cover" [alt]="p.title + ' image ' + ($index + 1)" />
                    </button>
                  }
                </div>
              }
            </div>

            <!-- ─────────────── RIGHT: Product Info ─────────────── -->
            <div class="space-y-5">

              <!-- Category chip + Title -->
              <div>
                @if (p.categoryId?.name) {
                  <span class="text-xs font-bold uppercase tracking-widest mb-1 block"
                        style="color:var(--color-primary)">{{ p.categoryId.name }}</span>
                }
                <h1 class="text-3xl font-extrabold font-display tracking-tight leading-tight"
                    style="color:var(--color-text)">{{ p.title }}</h1>
                <p class="text-xs mt-1" style="color:var(--color-text-muted)">
                  SKU: {{ selectedVariant()?.sku || p.sku }}
                </p>
              </div>

              <!-- ── Price + Rating row ── -->
              <div class="flex items-center justify-between py-4 border-y"
                   style="border-color:var(--color-border)">
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-extrabold" style="color:var(--color-text)">
                    ₹{{ (selectedVariant()?.price || p.discountPrice || p.price) | number:'1.0-0' }}
                  </span>
                  @if (p.discountPrice && p.discountPrice < p.price && !selectedVariant()?.price) {
                    <span class="line-through text-lg" style="color:var(--color-text-muted)">
                      ₹{{ p.price | number:'1.0-0' }}
                    </span>
                    <span class="text-sm font-bold" style="color:var(--color-primary)">
                      ({{ Math.round(((p.price - p.discountPrice) / p.price) * 100) }}% OFF)
                    </span>
                  }
                </div>

                <!-- Stars -->
                <div class="flex items-center gap-1">
                  <div class="flex">
                    @for (star of [1,2,3,4,5]; track star) {
                      <svg class="w-4 h-4"
                           [class]="star <= Math.round(p.rating || 0) ? 'star-filled' : 'star-empty'"
                           fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    }
                  </div>
                  <span class="text-xs font-medium" style="color:var(--color-text-muted)">
                    ({{ reviews().length }} reviews)
                  </span>
                </div>
              </div>

              <!-- ── Description ── -->
              <div class="space-y-1">
                <h3 class="font-bold text-xs uppercase tracking-wider"
                    style="color:var(--color-text-muted)">Product Info</h3>
                <p class="text-sm leading-relaxed" style="color:var(--color-text)">
                  {{ p.description || p.shortDescription }}
                </p>
              </div>

              <!-- ── Variant Selectors ── -->
              @if (p.variants?.length > 0) {
                <div class="space-y-4">
                  <!-- Size Picker -->
                  @if (availableSizes().length > 0) {
                    <div>
                      <h3 class="font-bold text-xs uppercase tracking-wider mb-2"
                          style="color:var(--color-text-muted)">
                        Size
                        @if (selectedSize()) {
                          <span class="ml-2 font-extrabold" style="color:var(--color-primary)">
                            — {{ selectedSize() }}
                          </span>
                        }
                      </h3>
                      <div class="flex flex-wrap gap-2">
                        @for (size of availableSizes(); track size) {
                          <button
                            (click)="selectSize(size)"
                            [attr.aria-pressed]="selectedSize() === size"
                            class="px-4 py-2 border rounded-xl text-sm font-bold transition-all duration-200"
                            [style]="selectedSize() === size
                              ? 'background:var(--color-primary);color:white;border-color:var(--color-primary);'
                              : 'background:white;color:var(--color-text);border-color:var(--color-border);'"
                          >{{ size }}</button>
                        }
                      </div>
                    </div>
                  }

                  <!-- Color Picker -->
                  @if (availableColors().length > 0) {
                    <div>
                      <h3 class="font-bold text-xs uppercase tracking-wider mb-2"
                          style="color:var(--color-text-muted)">
                        Color
                        @if (selectedColor()) {
                          <span class="ml-2 font-extrabold" style="color:var(--color-primary)">
                            — {{ selectedColor() }}
                          </span>
                        }
                      </h3>
                      <div class="flex flex-wrap gap-3">
                        @for (color of availableColors(); track color.name) {
                          <button
                            (click)="selectColor(color.name)"
                            [title]="color.name"
                            [attr.aria-label]="'Select color ' + color.name"
                            [attr.aria-pressed]="selectedColor() === color.name"
                            class="w-9 h-9 rounded-full border-2 flex items-center justify-center relative hover:scale-110 transition-transform duration-200"
                            [style.background-color]="color.hex || '#ccc'"
                            [style.border-color]="selectedColor() === color.name ? 'var(--color-primary)' : 'var(--color-border)'"
                            [style.box-shadow]="selectedColor() === color.name ? '0 0 0 3px white, 0 0 0 5px var(--color-primary)' : 'none'"
                          >
                            @if (selectedColor() === color.name) {
                              <span class="w-2 h-2 rounded-full bg-white shadow-sm block"></span>
                            }
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- ── Enhanced Stock Indicator ── -->
              @if (selectedVariant(); as v) {
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold uppercase tracking-wider"
                          style="color:var(--color-text-muted)">Availability</span>
                    <span class="text-xs font-bold"
                          [style.color]="v.stock === 0 ? '#ef4444' : v.stock <= 5 ? '#f97316' : '#22c55e'">
                      @if (v.stock === 0) { Out of Stock }
                      @else if (v.stock <= 5) { Only {{ v.stock }} left! }
                      @else { In Stock ({{ v.stock }} units) }
                    </span>
                  </div>
                  @if (v.stock > 0) {
                    <div class="stock-bar-track">
                      <div class="stock-bar-fill"
                           [style.width]="stockPercent(v.stock) + '%'"
                           [style.background]="v.stock <= 5 ? '#f97316' : v.stock <= 15 ? '#eab308' : 'var(--color-primary)'">
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- ── Quantity + Actions ── -->
              <div class="space-y-3 pt-2">
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <!-- Qty stepper -->
                  <div class="flex items-center rounded-xl overflow-hidden border justify-between sm:justify-start w-full sm:w-auto"
                       style="border-color:var(--color-border);background:white">
                    <button (click)="decreaseQty()"
                            class="px-4 py-3 font-bold text-lg transition-colors hover:bg-neutral-50"
                            style="color:var(--color-text-muted);min-width:44px"
                            aria-label="Decrease quantity">&minus;</button>
                    <span class="px-5 font-extrabold text-sm" style="color:var(--color-text)">{{ quantity() }}</span>
                    <button (click)="increaseQty()"
                            class="px-4 py-3 font-bold text-lg transition-colors hover:bg-neutral-50"
                            style="color:var(--color-text-muted);min-width:44px"
                            aria-label="Increase quantity">&plus;</button>
                  </div>

                  <!-- Add to cart + Wishlist -->
                  <div class="flex-1 flex gap-2 w-full">
                    <button
                      #ctaButton
                      [disabled]="selectedVariantStock() === 0"
                      (click)="addToCart()"
                      class="btn-primary flex-1 py-3 px-6 shadow-md justify-center font-bold"
                      aria-label="Add to cart"
                    >
                      @if (selectedVariantStock() === 0) { Out of Stock }
                      @else { 🛒 Add to Cart }
                    </button>

                    @if (authStore.isLoggedIn()) {
                      <button
                        (click)="toggleWishlist()"
                        class="btn-icon transition-all duration-200"
                        [style.color]="isWishlisted() ? '#ef4444' : 'var(--color-text-muted)'"
                        [style.background]="isWishlisted() ? '#fef2f2' : 'white'"
                        [style.border-color]="isWishlisted() ? '#fecaca' : 'var(--color-border)'"
                        [attr.aria-label]="isWishlisted() ? 'Remove from wishlist' : 'Add to wishlist'"
                        [attr.aria-pressed]="isWishlisted()"
                      >
                        <svg class="w-5 h-5" [attr.fill]="isWishlisted() ? 'currentColor' : 'none'"
                             stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- ══ TRUST / OFFERS BADGES ══ -->
              <div class="flex gap-3 pt-1">
                <!-- Free Shipping -->
                <div class="trust-badge">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
                  </svg>
                  <span>Free Shipping<br/>on ₹499+</span>
                </div>
                <!-- Easy Returns -->
                <div class="trust-badge">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span>7-Day Easy<br/>Returns</span>
                </div>
                <!-- Organic -->
                <div class="trust-badge">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                  </svg>
                  <span>100%<br/>Organic Cotton</span>
                </div>
              </div>

              <!-- ══ PRODUCT SPECIFICATIONS ACCORDION ══ -->
              <div class="border rounded-2xl overflow-hidden" style="border-color:var(--color-border)">
                <button
                  (click)="toggleAccordion()"
                  class="w-full flex items-center justify-between px-5 py-4 font-bold text-sm transition-colors hover:bg-neutral-50"
                  style="color:var(--color-text)"
                  [attr.aria-expanded]="accordionOpen()"
                >
                  <span>📋 Product Specifications</span>
                  <svg class="w-4 h-4 transition-transform duration-300"
                       [style.transform]="accordionOpen() ? 'rotate(180deg)' : 'rotate(0deg)'"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                <div class="accordion-body" [class.open]="accordionOpen()">
                  <div class="px-5 pb-5 pt-1 grid grid-cols-2 gap-4 border-t"
                       style="border-color:var(--color-border)">

                    @if (p.material) {
                      <div class="space-y-0.5">
                        <dt class="text-xs font-semibold uppercase tracking-wider"
                            style="color:var(--color-text-muted)">Material</dt>
                        <dd class="text-sm font-bold" style="color:var(--color-text)">{{ p.material }}</dd>
                      </div>
                    }
                    @if (p.careInstructions) {
                      <div class="space-y-0.5">
                        <dt class="text-xs font-semibold uppercase tracking-wider"
                            style="color:var(--color-text-muted)">Care Instructions</dt>
                        <dd class="text-sm font-bold" style="color:var(--color-text)">{{ p.careInstructions }}</dd>
                      </div>
                    }
                    @if (p.ageGroup) {
                      <div class="space-y-0.5">
                        <dt class="text-xs font-semibold uppercase tracking-wider"
                            style="color:var(--color-text-muted)">Age Group</dt>
                        <dd class="text-sm font-bold" style="color:var(--color-text)">{{ p.ageGroup }}</dd>
                      </div>
                    }
                    <div class="space-y-0.5">
                      <dt class="text-xs font-semibold uppercase tracking-wider"
                          style="color:var(--color-text-muted)">Brand</dt>
                      <dd class="text-sm font-bold" style="color:var(--color-text)">Happy Hamper</dd>
                    </div>
                    @if (p.gender) {
                      <div class="space-y-0.5">
                        <dt class="text-xs font-semibold uppercase tracking-wider"
                            style="color:var(--color-text-muted)">Gender</dt>
                        <dd class="text-sm font-bold" style="color:var(--color-text)">{{ p.gender }}</dd>
                      </div>
                    }
                    @if (p.countryOfOrigin) {
                      <div class="space-y-0.5">
                        <dt class="text-xs font-semibold uppercase tracking-wider"
                            style="color:var(--color-text-muted)">Origin</dt>
                        <dd class="text-sm font-bold" style="color:var(--color-text)">{{ p.countryOfOrigin }}</dd>
                      </div>
                    }
                    <!-- Fallback specs if no specific fields -->
                    @if (!p.material && !p.careInstructions && !p.ageGroup) {
                      <div class="col-span-2 text-sm" style="color:var(--color-text-muted)">
                        Made with 100% GOTS-certified organic cotton. Gentle on baby's skin.
                        Machine washable at 30°C. Do not tumble dry.
                      </div>
                    }
                  </div>
                </div>
              </div>

            </div><!-- /right panel -->
          </div><!-- /main grid -->


          <!-- ══════════════════════════════════════════════════════════ -->
          <!--  REVIEWS SECTION                                          -->
          <!-- ══════════════════════════════════════════════════════════ -->
          <section class="mt-16 border-t pt-10" style="border-color:var(--color-border)">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

              <!-- Rating summary + form -->
              <div class="col-span-1 space-y-6">
                <h2 class="text-2xl font-bold font-display" style="color:var(--color-text)">Customer Reviews</h2>

                <!-- Rating box -->
                <div class="flex items-center gap-4 rounded-2xl p-6"
                     style="background:var(--color-bg-subtle);border:1px solid var(--color-border)">
                  <div class="text-center">
                    <div class="text-4xl font-extrabold" style="color:var(--color-text)">
                      {{ (p.rating | number:'1.1-1') || '0.0' }}
                    </div>
                    <div class="text-xs mt-1" style="color:var(--color-text-muted)">out of 5</div>
                  </div>
                  <div class="flex-1 space-y-1">
                    <div class="flex items-center gap-1.5">
                      <div class="flex">
                        @for (star of [1,2,3,4,5]; track star) {
                          <svg class="w-3.5 h-3.5"
                               [class]="star <= Math.round(p.rating || 0) ? 'star-filled' : 'star-empty'"
                               fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        }
                      </div>
                      <span class="text-xs font-semibold" style="color:var(--color-text-muted)">
                        {{ reviews().length }} ratings total
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Review Form -->
                @if (authStore.isLoggedIn()) {
                  <div class="card p-6 space-y-4">
                    <h3 class="font-bold text-sm uppercase tracking-wider" style="color:var(--color-text)">
                      Write a Review
                    </h3>
                    <form [formGroup]="reviewForm" (ngSubmit)="submitReview()" class="space-y-3">
                      <div>
                        <label class="block text-xs font-semibold mb-1" style="color:var(--color-text-muted)">
                          Rating
                        </label>
                        <select formControlName="rating" class="input-field py-2">
                          <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                          <option value="4">⭐⭐⭐⭐ Good</option>
                          <option value="3">⭐⭐⭐ Average</option>
                          <option value="2">⭐⭐ Poor</option>
                          <option value="1">⭐ Very Poor</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold mb-1" style="color:var(--color-text-muted)">
                          Your Review
                        </label>
                        <textarea formControlName="comment" rows="4"
                                  placeholder="Tell us about the fabric, fit, and style..."
                                  class="input-field resize-none"></textarea>
                      </div>
                      <button type="submit"
                              [disabled]="reviewForm.invalid || submittingReview()"
                              class="btn-primary w-full py-2.5 text-sm">
                        @if (submittingReview()) { Submitting… } @else { Submit Review }
                      </button>
                    </form>
                  </div>
                } @else {
                  <p class="text-xs" style="color:var(--color-text-muted)">
                    Please
                    <a routerLink="/auth/login" class="font-bold hover:underline"
                       style="color:var(--color-primary)">sign in</a>
                    to leave a review.
                  </p>
                }
              </div><!-- /review left col -->

              <!-- Reviews list -->
              <div class="col-span-1 lg:col-span-2 space-y-5">
                @if (reviews().length === 0) {
                  <div class="card p-8 text-center" style="color:var(--color-text-muted)">
                    <p class="text-sm">No reviews yet. Be the first to share your feedback!</p>
                  </div>
                } @else {
                  @for (rev of reviews(); track rev.id || rev._id) {
                    <div class="card p-5 space-y-3 animate-slide-up">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
                               style="background:var(--color-primary)">
                            {{ rev.userId?.firstName?.charAt(0) || 'U' }}
                          </div>
                          <div>
                            <div class="text-sm font-bold" style="color:var(--color-text)">
                              {{ rev.userId?.firstName }} {{ rev.userId?.lastName }}
                            </div>
                            <div class="text-[10px]" style="color:var(--color-text-muted)">
                              {{ rev.createdAt | date:'mediumDate' }}
                            </div>
                          </div>
                        </div>
                        <div class="flex">
                          @for (star of [1,2,3,4,5]; track star) {
                            <svg class="w-3.5 h-3.5"
                                 [class]="star <= rev.rating ? 'star-filled' : 'star-empty'"
                                 fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                          }
                        </div>
                      </div>
                      <p class="text-sm leading-relaxed italic" style="color:var(--color-text)">
                        "{{ rev.comment }}"
                      </p>
                      @if (rev.isVerifiedPurchase) {
                        <div class="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                             style="color:var(--color-primary)">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                          </svg>
                          Verified Purchase
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            </div>
          </section>

          <!-- ══════════════════════════════════════════════════════════ -->
          <!--  RELATED PRODUCTS — You May Also Like                     -->
          <!-- ══════════════════════════════════════════════════════════ -->
          @if (relatedProducts().length > 0) {
            <section class="mt-16 border-t pt-10" style="border-color:var(--color-border)">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-2xl font-bold font-display" style="color:var(--color-text)">
                    You May Also Like
                  </h2>
                  <p class="text-sm mt-0.5" style="color:var(--color-text-muted)">
                    More from this collection
                  </p>
                </div>
                <a [routerLink]="['/products']"
                   [queryParams]="{category: p.categoryId?._id}"
                   class="btn-ghost text-sm">View All →</a>
              </div>
              <div class="related-scroll">
                @for (rel of relatedProducts(); track rel.id || rel._id) {
                  <div class="related-card" (click)="navigateToProduct(rel.slug)"
                       role="button" [attr.aria-label]="'View ' + rel.title">
                    <img [src]="rel.images?.[0] || '/assets/placeholder-product.jpg'"
                         [alt]="rel.title" loading="lazy"/>
                    <div class="related-card-body">
                      <p class="text-xs font-bold leading-tight mb-1"
                         style="color:var(--color-text)">{{ rel.title }}</p>
                      <div class="flex items-baseline gap-1">
                        <span class="text-sm font-extrabold" style="color:var(--color-primary)">
                          ₹{{ (rel.discountPrice || rel.price) | number:'1.0-0' }}
                        </span>
                        @if (rel.discountPrice && rel.discountPrice < rel.price) {
                          <span class="text-xs line-through" style="color:var(--color-text-muted)">
                            ₹{{ rel.price | number:'1.0-0' }}
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- ══════════════════════════════════════════════════════════ -->
          <!--  RECENTLY VIEWED PRODUCTS                                   -->
          <!-- ══════════════════════════════════════════════════════════ -->
          @if (recentlyViewedItems().length > 0) {
            <section class="mt-16 border-t pt-10" style="border-color:var(--color-border)">
              <div class="mb-6">
                <h2 class="text-2xl font-bold font-display" style="color:var(--color-text)">
                  Recently Viewed
                </h2>
                <p class="text-sm mt-0.5" style="color:var(--color-text-muted)">
                  Products you looked at recently
                </p>
              </div>
              <div class="related-scroll">
                @for (item of recentlyViewedItems(); track item._id) {
                  <div class="related-card" (click)="navigateToProduct(item.slug)"
                       role="button" [attr.aria-label]="'View ' + item.title">
                    <img [src]="item.images?.[0] || '/assets/placeholder-product.jpg'"
                         [alt]="item.title" loading="lazy"/>
                    <div class="related-card-body">
                      <p class="text-xs font-bold leading-tight mb-1"
                         style="color:var(--color-text)">{{ item.title }}</p>
                      <div class="flex items-baseline gap-1">
                        <span class="text-sm font-extrabold" style="color:var(--color-primary)">
                          ₹{{ (item.discountPrice || item.price) | number:'1.0-0' }}
                        </span>
                        @if (item.discountPrice && item.discountPrice < item.price) {
                          <span class="text-xs line-through" style="color:var(--color-text-muted)">
                            ₹{{ item.price | number:'1.0-0' }}
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

        }<!-- /product() as p -->
      }<!-- /else loaded -->
    </div><!-- /bb-container -->

    <!-- ══════════════════════════════════════════════════════════════════ -->
    <!--  STICKY ADD-TO-CART BAR (appears when scrolled past main CTA)   -->
    <!-- ══════════════════════════════════════════════════════════════════ -->
    @if (product(); as p) {
      <div class="sticky-cart-bar" [class.visible]="showStickyBar()">
        <div class="bb-container py-3 flex items-center gap-4">
          <!-- Product thumb -->
          <img [src]="activeImage() || '/assets/placeholder-product.jpg'"
               [alt]="p.title"
               class="w-11 h-11 rounded-xl object-cover flex-shrink-0"
               style="border:1px solid var(--color-border)" />
          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm truncate" style="color:var(--color-text)">{{ p.title }}</p>
            <p class="text-sm font-extrabold" style="color:var(--color-primary)">
              ₹{{ (selectedVariant()?.price || p.discountPrice || p.price) | number:'1.0-0' }}
            </p>
          </div>
          <!-- CTA -->
          <button
            [disabled]="selectedVariantStock() === 0"
            (click)="addToCart()"
            class="btn-primary py-2.5 px-6 flex-shrink-0 shadow-md"
            aria-label="Add to cart from sticky bar"
          >
            @if (selectedVariantStock() === 0) { Sold Out } @else { Add to Cart }
          </button>
        </div>
      </div>
    }
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
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private recentlyViewedService = inject(RecentlyViewedService);

  private routeSub!: Subscription;

  // ── Core signals ──────────────────────────────────────────────────────
  product = signal<any | null>(null);
  reviews = signal<any[]>([]);
  relatedProducts = signal<any[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  recentlyViewedItems = computed(() => {
    const currentId = this.product()?._id || this.product()?.id;
    return this.recentlyViewedService.items().filter((p: any) => p._id !== currentId);
  });

  // ── Image & quantity ─────────────────────────────────────────────────
  activeImage = signal<string>('');
  quantity = signal<number>(1);

  // ── Variant selectors ────────────────────────────────────────────────
  availableSizes = signal<string[]>([]);
  availableColors = signal<{ name: string; hex: string }[]>([]);
  selectedSize = signal<string | null>(null);
  selectedColor = signal<string | null>(null);
  selectedVariant = signal<any | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────
  accordionOpen = signal<boolean>(false);
  showStickyBar = signal<boolean>(false);

  // ── Review form ───────────────────────────────────────────────────────
  reviewForm = this.fb.group({
    rating: ['5', [Validators.required]],
    comment: ['', [Validators.required, Validators.minLength(5)]],
  });
  submittingReview = signal<boolean>(false);

  readonly Math = Math;

  // ── Scroll listener for sticky bar ───────────────────────────────────
  @HostListener('window:scroll')
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      // Show sticky bar once user scrolls past ~400px (past the main CTA)
      const scrollY = window.scrollY || window.pageYOffset;
      const shouldShow = scrollY > 420;
      if (shouldShow !== this.showStickyBar()) {
        this.showStickyBar.set(shouldShow);
        this.cdr.markForCheck();
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────
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
    // Remove JSON-LD on component destroy
    if (isPlatformBrowser(this.platformId)) {
      const el = this.document.getElementById('bb-product-jsonld');
      if (el) el.remove();
    }
  }

  // ─────────────────────────────────────────────────────────────────────
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

        // ── Setup variants ───────────────────────────────────────────
        if (prod.variants?.length > 0) {
          const sizesSet = new Set<string>();
          const colorsMap = new Map<string, string>();
          prod.variants.forEach((v: any) => {
            if (v.size) sizesSet.add(v.size);
            if (v.color) colorsMap.set(v.color, v.colorHex || '#ccc');
          });
          this.availableSizes.set(Array.from(sizesSet));
          this.availableColors.set(
            Array.from(colorsMap.entries()).map(([name, hex]) => ({ name, hex }))
          );
          const defaultVariant = prod.variants[0];
          this.selectedVariant.set(defaultVariant);
          if (defaultVariant.size) this.selectedSize.set(defaultVariant.size);
          if (defaultVariant.color) this.selectedColor.set(defaultVariant.color);
        }

        this.loading.set(false);
        this.cdr.markForCheck();

        // ── Load related data & side-effects ─────────────────────────
        const productId = prod._id || prod.id;
        this.loadReviews(productId);
        this.loadRelatedProducts(prod);
        this.trackRecentlyViewed(prod);
        this.injectJsonLd(prod);
      },
      error: () => {
        this.error.set('Failed to load product details. Please try again.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  loadReviews(productId: string) {
    this.http.get<any>(`${environment.apiUrl}/reviews/product/${productId}`).subscribe({
      next: (res) => {
        this.reviews.set(res.data || []);
        this.cdr.markForCheck();
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  loadRelatedProducts(prod: any) {
    const productId = prod._id || prod.id;
    this.productService.getRelated(productId, 8).subscribe({
      next: (res: any) => {
        const items = (res.data || []).filter((r: any) => r._id !== productId);
        this.relatedProducts.set(items.slice(0, 6));
        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback: fetch by category
        const catId = prod.categoryId?._id;
        if (catId) {
          this.http.get<any>(`${environment.apiUrl}/products`, {
            params: { category: catId, limit: '7' }
          }).subscribe({
            next: (res2) => {
              const filtered = (res2.data || res2.products || [])
                .filter((r: any) => (r._id || r.id) !== productId)
                .slice(0, 6);
              this.relatedProducts.set(filtered);
              this.cdr.markForCheck();
            },
          });
        }
      }
    });
  }

  // ── Recently Viewed ──────────────────────────────────────────────────
  trackRecentlyViewed(prod: any) {
    this.recentlyViewedService.add({
      _id: prod._id || prod.id,
      title: prod.title,
      slug: prod.slug,
      images: prod.images || [],
      price: prod.price,
      discountPrice: prod.discountPrice,
      rating: prod.rating
    });
  }

  // ── JSON-LD Structured Data ───────────────────────────────────────────
  injectJsonLd(prod: any) {
    if (!isPlatformBrowser(this.platformId)) return;
    // Remove old script if exists
    const existing = this.document.getElementById('bb-product-jsonld');
    if (existing) existing.remove();

    const price = prod.discountPrice || prod.price;
    const schema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: prod.title,
      description: prod.description || prod.shortDescription || '',
      image: prod.images || [],
      sku: prod.sku || '',
      brand: {
        '@type': 'Brand',
        name: 'Happy Hamper',
      },
      offers: {
        '@type': 'Offer',
        url: this.document.location.href,
        priceCurrency: 'INR',
        price: price?.toString() || '0',
        itemCondition: 'https://schema.org/NewCondition',
        availability:
          (prod.stock || 0) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
      },
      ...(prod.rating && prod.rating > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: prod.rating.toFixed(1),
              reviewCount: this.reviews().length || 1,
              bestRating: '5',
              worstRating: '1',
            },
          }
        : {}),
    };

    const script = this.document.createElement('script');
    script.id = 'bb-product-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  // ── Accordion toggle ──────────────────────────────────────────────────
  toggleAccordion() {
    this.accordionOpen.update((v) => !v);
  }

  // ── Image selection ───────────────────────────────────────────────────
  setActiveImage(img: string) {
    this.activeImage.set(img);
  }

  // ── Wishlist ──────────────────────────────────────────────────────────
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

  // ── Variant selection ─────────────────────────────────────────────────
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
    if (!prod?.variants) return;
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

  // ── Stock helpers ─────────────────────────────────────────────────────
  selectedVariantStock(): number {
    const v = this.selectedVariant();
    if (v) return v.stock ?? 0;
    const prod = this.product();
    return prod ? prod.stock ?? 10 : 0;
  }

  /** Returns stock as a percentage of a max (capped at 30 for visual scale). */
  stockPercent(stock: number): number {
    const max = 30;
    return Math.min(100, Math.round((stock / max) * 100));
  }

  // ── Quantity ──────────────────────────────────────────────────────────
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

  // ── Add to Cart ───────────────────────────────────────────────────────
  addToCart() {
    const prod = this.product();
    if (!prod) return;
    const variant = this.selectedVariant();
    const sku = variant ? variant.sku : prod.sku;
    this.cartStore.addItem(prod._id || prod.id, sku, this.quantity()).subscribe();
  }

  // ── Submit Review ─────────────────────────────────────────────────────
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
      next: () => {
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

  // ── Navigate to related product ───────────────────────────────────────
  navigateToProduct(slug: string) {
    this.router.navigate(['/products', slug]);
  }
}
