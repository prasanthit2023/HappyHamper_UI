import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductService } from '../../../../core/services/product.service';
import { CartStore } from '../../../../state/cart.store';
import { WishlistStore } from '../../../../state/wishlist.store';
import { AuthStore } from '../../../../state/auth.store';
import { ToastService } from '../../../../core/services/toast.service';
import { RecentlyViewedService } from '../../../../core/services/recently-viewed.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  template: `
    <!-- ══════════════════════════════════════════════════════
         HERO SECTION
    ══════════════════════════════════════════════════════ -->
    <section class="relative min-h-[85vh] flex items-center overflow-hidden" style="background: var(--gradient-pastel);">
      <!-- Decorative background blooms -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
           style="background: radial-gradient(circle, rgba(124,131,195,0.06) 0%, transparent 70%); transform: translate(20%, -20%);"></div>
      <div class="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full pointer-events-none"
           style="background: radial-gradient(circle, rgba(160,149,139,0.08) 0%, transparent 70%); transform: translate(-20%, 20%);"></div>

      <div class="bb-container relative z-10 py-12">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          
          <!-- Hero Text -->
          <div class="animate-slide-up flex flex-col justify-center">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs mb-6 font-semibold uppercase tracking-wider w-fit"
                 style="background: var(--color-primary-light); color: var(--color-primary);">
              <svg class="w-4 h-4 animate-bounce-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 21C12 14.5 9 10 9 5"/>
              </svg>
              Pure Organic Cotton Collection
            </div>
            
            <h1 class="font-display text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.1] mb-6 min-h-[140px] md:min-h-[110px] text-neutral-800 transition-all duration-500 animate-fade-in">
              {{ activeHero()?.title || 'Gentle Pieces, Precious Memories' }}
            </h1>
            
            <p class="text-base lg:text-lg mb-8 max-w-lg leading-relaxed min-h-[80px] text-neutral-500 transition-all duration-500 animate-fade-in">
              {{ activeHero()?.subtitle || 'Adorable, soft, and safe clothing for newborns and babies aged 0–24 months. Made with love and 100% certified organic cotton.' }}
            </p>
            
            <div class="flex flex-wrap gap-4">
              <a [routerLink]="getRoutePath(activeHero()?.link || '/products')" [queryParams]="getRouteQueryParams(activeHero()?.link || '/products', {newArrival:true})" class="btn-primary text-base px-8 py-4 flex items-center gap-2 shadow-sm active:scale-95 transition-all" id="hero-shop-now">
                {{ activeHero()?.ctaText || 'Discover Collection' }}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </a>
              <a routerLink="/products" [queryParams]="{bestSeller:true}" class="btn-secondary text-base px-8 py-4 inline-flex items-center gap-2 hover:bg-neutral-50 active:scale-95 transition-all">
                Best Sellers
              </a>
            </div>

            <!-- Trust badges -->
            <div class="flex flex-wrap gap-6 mt-10">
              @for (badge of trustBadges; track badge.label) {
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: white; box-shadow: 0 2px 8px rgba(62,57,53,0.03);">
                    <svg class="w-5 h-5" [style.color]="badge.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="badge.svgPath"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-semibold text-sm text-neutral-800">{{ badge.label }}</div>
                    <div class="text-xs text-neutral-400">{{ badge.sub }}</div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Hero Visual -->
          <div class="relative hidden lg:flex items-center justify-center">
            <div class="relative w-full max-w-[440px]">
              @if (activeHero()?.imageUrl) {
                <div class="relative rounded-3xl overflow-hidden shadow-float aspect-[4/5] bg-neutral-50 border border-beige transition-all duration-500 animate-fade-in">
                  <img [src]="activeHero()?.imageUrl" alt="Featured Happy Hamper Collection" class="w-full h-full object-cover rounded-3xl" />
                </div>
              } @else {
                <!-- Fallback premium layout visual -->
                <div class="relative rounded-3xl overflow-hidden shadow-float aspect-[4/5] flex items-center justify-center bg-white border border-beige">
                  <div class="text-center space-y-4 px-8 w-full">
                    <div class="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center bg-neutral-50 border border-beige shadow-sm">
                      <!-- Custom Bluebell Flower SVG -->
                      <svg class="w-14 h-14 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21C12 14.5 9 10 9 5 M9 5c1-1 3-1 4 0 M12 7c1.5 0 2.5 1 2.5 2.5v1c0 1-1 1.5-2 1.5s-2-0.5-2-1.5 M9 11c1.5 0 2.5 1 2.5 2.5v1c0 1-1 1.5-2 1.5s-2-0.5-2-1.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="font-display font-black text-2xl tracking-wider text-neutral-800">HAPPY HAMPER</h3>
                      <p class="text-xs text-neutral-400 font-semibold tracking-widest mt-1">GENTLE PIECES, PRECIOUS MEMORIES</p>
                    </div>
                  </div>
                </div>
              }

              <!-- Floating stat cards -->
              <div class="absolute -left-10 top-12 card px-4 py-3 animate-fade-in shadow-float bg-white border border-beige">
                <div class="text-2xl font-bold text-primary">100%</div>
                <div class="text-xs font-semibold text-neutral-500">Organic Cotton</div>
              </div>
              <div class="absolute -right-8 bottom-20 card px-4 py-3 animate-fade-in shadow-float bg-white border border-beige" style="animation-delay:0.3s">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span class="font-bold text-sm text-neutral-800">4.9/5</span>
                </div>
                <div class="text-xs text-neutral-400">Avg. rating</div>
              </div>
              <div class="absolute -left-4 bottom-14 card px-3 py-2 animate-fade-in shadow-float bg-white border border-beige" style="animation-delay:0.6s">
                <div class="flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs" style="background: var(--color-primary-light); color: var(--color-primary);">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </span>
                  <span class="text-xs font-semibold text-neutral-700">Premium Quality</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Carousel Dots Navigation -->
      @if (heroBanners().length > 1) {
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
          @for (b of heroBanners(); track b._id || b.id; let idx = $index) {
            <button (click)="setHeroIndex(idx)" 
                    class="w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none"
                    [style.background]="activeHeroIndex() === idx ? 'var(--color-primary)' : 'rgba(62,57,53,0.15)'"
                    [style.transform]="activeHeroIndex() === idx ? 'scale(1.2)' : 'none'"
                    [attr.aria-label]="'Go to slide ' + (idx + 1)"></button>
          }
        </div>

        <!-- Left/Right Arrow Buttons (Desktop) -->
        <button (click)="prevHero()" class="absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-beige items-center justify-center text-neutral-700 hover:text-primary transition-all active:scale-95 z-20 shadow-sm focus:outline-none">
          <i class="pi pi-chevron-left text-xs"></i>
        </button>
        <button (click)="nextHero()" class="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-beige items-center justify-center text-neutral-700 hover:text-primary transition-all active:scale-95 z-20 shadow-sm focus:outline-none">
          <i class="pi pi-chevron-right text-xs"></i>
        </button>
      }
    </section>

    <!-- ══════════════════════════════════════════════════════
         CATEGORY CARDS SECTION
    ══════════════════════════════════════════════════════ -->
    <section class="py-16" style="background: white;">
      <div class="bb-container">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="section-title text-2xl text-neutral-800">Shop by Category</h2>
            <p class="section-subtitle text-sm text-neutral-500">Gentle clothing & accessories for your baby</p>
          </div>
          <a routerLink="/products" class="btn-ghost hidden sm:inline-flex items-center gap-1 hover:text-primary">
            View all
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        @if (categories().length === 0) {
          <div class="w-full text-center py-6 text-neutral-400 text-xs">No active categories.</div>
        } @else {
          <!-- Desktop Grid View (systems) -->
          <div class="hidden md:grid grid-cols-5 gap-6">
            @for (cat of categories(); track cat.slug) {
              <a
                [routerLink]="['/category', cat.slug]"
                class="card p-5 flex flex-col items-center justify-center gap-4 group cursor-pointer w-full text-center hover-lift border border-beige relative overflow-hidden transition-all duration-300"
                [style.background]="cat.style.color"
              >
                <!-- Soft background pattern -->
                <div class="absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-[0.04] group-hover:scale-125 transition-transform" 
                     [style.background]="cat.style.iconColor"></div>

                <div class="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
                     style="box-shadow: 0 4px 10px rgba(62,57,53,0.03);">
                  <svg class="w-8 h-8" [style.color]="cat.style.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="cat.style.svgPath"/>
                  </svg>
                </div>
                <div>
                  <span class="text-sm font-bold text-neutral-800 transition-colors group-hover:text-primary">
                    {{ cat.name }}
                  </span>
                  <span class="block text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-0.5 group-hover:text-primary/70">Shop Now</span>
                </div>
              </a>
            }
          </div>

          <!-- Mobile Carousel View (mobile phones) -->
          <div class="flex md:hidden gap-4 overflow-x-auto pb-4 snap-x snap-mandatory font-sans" style="scrollbar-width: none;">
            @for (cat of categories(); track cat.slug) {
              <a
                [routerLink]="['/category', cat.slug]"
                class="flex-shrink-0 snap-start card p-4 flex flex-col items-center justify-center gap-3 group cursor-pointer border border-beige rounded-2xl w-28"
                [style.background]="cat.style.color"
              >
                <div class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center"
                     style="box-shadow: 0 4px 10px rgba(62,57,53,0.03);">
                  <svg class="w-6 h-6" [style.color]="cat.style.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="cat.style.svgPath"/>
                  </svg>
                </div>
                <span class="text-xs font-bold text-neutral-800 text-center truncate w-full">
                  {{ cat.name }}
                </span>
              </a>
            }
          </div>
        }
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════
         PROMOTIONS / BANNER STRIP
    ══════════════════════════════════════════════════════ -->
    @if (middleBanners().length > 0) {
      <section class="py-4" style="background: var(--color-bg);">
        <div class="bb-container">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (promo of middleBanners(); track promo._id || promo.id) {
              <a [routerLink]="getRoutePath(promo.link || '/products')" 
                 [queryParams]="getRouteQueryParams(promo.link || '/products')"
                 class="relative rounded-2xl overflow-hidden h-36 flex items-center px-6 group cursor-pointer transition-all duration-300 hover:-translate-y-1 block promo-card shadow-sm"
                 [style.background]="promo.bg">
                <div class="relative z-10 max-w-[70%]">
                  <p class="text-[9px] font-bold text-white/80 uppercase tracking-widest mb-1">PROMOTION</p>
                  <h3 class="font-display font-bold text-white text-base lg:text-lg leading-tight">{{ promo.title }}</h3>
                  <p class="text-white/70 text-xs mt-1 line-clamp-1">{{ promo.subtitle }}</p>
                  <span class="inline-flex items-center gap-1 text-white/90 text-xs mt-2 group-hover:gap-2 transition-all font-semibold">
                    {{ promo.ctaText || 'Shop now' }}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </span>
                </div>
                <div class="absolute right-0 top-0 bottom-0 w-1/3 opacity-25 group-hover:opacity-45 group-hover:scale-110 transition-all duration-300">
                  @if (promo.imageUrl) {
                    <img [src]="promo.imageUrl" alt="" class="w-full h-full object-cover" />
                  }
                </div>
              </a>
            }
          </div>
        </div>
      </section>
    }

    <!-- ══════════════════════════════════════════════════════
         INTERACTIVE PRODUCTS SHOWCASE
    ══════════════════════════════════════════════════════ -->
    <section class="py-16 bg-white">
      <div class="bb-container">
        <div class="text-center mb-10">
          <h2 class="section-title text-neutral-800">Happy Hamper Products Showcase</h2>
          <p class="section-subtitle text-neutral-500">Select a product type to view all available varieties</p>
        </div>

        <!-- Tabs headers -->
        <div class="flex flex-wrap justify-center gap-3 mb-10">
          @for (cat of categories(); track cat.id) {
            @if (cat.slug !== 'combos') {
              <button
                (click)="loadShowcaseProducts(cat.id)"
                [class.btn-primary]="activeShowcaseCategoryId() === cat.id"
                [class.btn-secondary]="activeShowcaseCategoryId() !== cat.id"
                class="px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200"
              >
                {{ cat.name }}
              </button>
            }
          }
        </div>

        @if (loadingShowcase()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            @for (s of skeletons; track s) {
              <div class="rounded-2xl overflow-hidden card p-2 bg-white animate-pulse">
                <div class="skeleton aspect-[3/4] w-full rounded-2xl"></div>
                <div class="p-3 space-y-2">
                  <div class="skeleton h-4 w-3/4 rounded"></div>
                  <div class="skeleton h-4 w-1/2 rounded"></div>
                </div>
              </div>
            }
          </div>
        } @else if (showcaseProducts().length === 0) {
          <div class="text-center py-12 text-neutral-400 text-sm">No products available in this showcase.</div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-fade-in">
            @for (product of showcaseProducts(); track product._id) {
              <bb-product-card [product]="product" (quickAdd)="onQuickAdd($event)" />
            }
          </div>
        }
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════
         COMBOS SPOTLIGHT SECTION
    ══════════════════════════════════════════════════════ -->
    <section class="py-16" style="background: var(--color-bg-subtle);">
      <div class="bb-container">
        <div class="text-center mb-10">
          <span class="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-primary-light text-primary mb-2">Value Bundles</span>
          <h2 class="section-title text-3xl text-neutral-800">Happy Hamper Combo Packs</h2>
          <p class="section-subtitle text-neutral-500 font-medium">Specially curated gift sets and essential starter bundles for your baby.</p>
        </div>

        @if (comboProducts().length === 0) {
          <div class="text-center py-6 text-neutral-400 text-xs">Loading premium combos...</div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @for (p of comboProducts(); track p._id) {
              <div class="card p-5 bg-white border border-beige flex flex-col justify-between hover-lift relative overflow-hidden group">
                <span class="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider z-10">Best Value</span>
                
                <a [routerLink]="['/products', p.slug]" class="block aspect-[4/3] rounded-xl overflow-hidden bg-neutral-50 mb-5 relative">
                  <img [src]="p.images?.[0]" [alt]="p.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </a>

                <div class="space-y-2">
                  <a [routerLink]="['/products', p.slug]" class="block">
                    <h3 class="font-display font-bold text-lg text-neutral-800 group-hover:text-primary transition-colors">{{ p.title }}</h3>
                  </a>
                  <p class="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{{ p.shortDescription || p.description }}</p>
                  
                  <div class="flex items-center justify-between pt-4 border-t border-beige">
                    <div>
                      <span class="text-lg font-bold text-neutral-800">₹{{ p.discountPrice || p.price }}</span>
                      @if (p.discountPrice && p.price > p.discountPrice) {
                        <span class="text-xs text-neutral-400 line-through ml-2">₹{{ p.price }}</span>
                      }
                    </div>
                    
                    <div class="flex items-center gap-2">
                      <!-- Wishlist Button -->
                      <button
                        (click)="onToggleWishlist($event, p)"
                        class="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                        [style.color]="isWishlisted(p) ? 'var(--color-pink)' : '#9CA3AF'"
                        [style.background]="isWishlisted(p) ? '#FDF2F8' : 'white'"
                        [attr.aria-label]="isWishlisted(p) ? 'Remove from wishlist' : 'Add to wishlist'"
                        [attr.id]="'wishlist-' + (p._id || p.id)"
                      >
                        <i [class]="isWishlisted(p) ? 'pi pi-heart-fill text-xs' : 'pi pi-heart text-xs'"></i>
                      </button>

                      <button
                        (click)="onQuickAdd(p)"
                        class="btn-primary px-4 py-2.5 text-xs rounded-lg flex items-center gap-1.5 active:scale-95"
                      >
                        <i class="pi pi-plus text-xs"></i>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════
         BEST SELLERS
    ══════════════════════════════════════════════════════ -->
    <section class="py-16 bg-white">
      <div class="bb-container">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="section-title flex items-center gap-2 text-neutral-800">
              Best Sellers
              <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
              </svg>
            </h2>
            <p class="section-subtitle text-neutral-500">Most loved by our customers</p>
          </div>
          <a routerLink="/products" [queryParams]="{bestSeller:true}" class="btn-secondary hidden sm:inline-flex text-sm">
            View all
          </a>
        </div>

        @if (loadingBestSellers()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            @for (s of skeletons; track s) {
              <div class="rounded-2xl overflow-hidden card p-2 bg-white animate-pulse">
                <div class="skeleton aspect-[3/4] w-full rounded-2xl"></div>
                <div class="p-3 space-y-2">
                  <div class="skeleton h-4 w-3/4 rounded"></div>
                  <div class="skeleton h-4 w-1/2 rounded"></div>
                </div>
              </div>
            }
          </div>
        } @else if (bestSellers().length === 0) {
          <div class="text-center py-12 text-neutral-400 text-sm">No best seller products available.</div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            @for (product of bestSellers(); track product._id) {
              <bb-product-card [product]="product" (quickAdd)="onQuickAdd($event)" />
            }
          </div>
        }
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════
         TESTIMONIALS
    ══════════════════════════════════════════════════════ -->
    <section class="py-16" style="background: white;">
      <div class="bb-container">
        <div class="text-center mb-12">
          <h2 class="section-title flex items-center justify-center gap-2">
            What Parents Say
            <svg class="w-6 h-6" style="color: var(--color-error);" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </h2>
          <p class="section-subtitle">Over 50,000 happy families trust Happy Hamper</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (t of testimonials; track t.name) {
            <div class="card p-6 flex flex-col gap-4 animate-fade-in hover-lift bg-white">
              <!-- Stars -->
              <div class="flex gap-0.5">
                @for (s of [1,2,3,4,5]; track s) {
                  <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                }
              </div>
              <p class="text-sm leading-relaxed italic" style="color: var(--color-text-muted);">
                "{{ t.text }}"
              </p>
              <div class="flex items-center gap-3 mt-auto">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                     style="background: var(--gradient-primary);">
                  {{ t.name.charAt(0) }}
                </div>
                <div>
                  <div class="font-semibold text-sm" style="color: var(--color-text);">{{ t.name }}</div>
                  <div class="text-xs" style="color: var(--color-text-muted);">{{ t.location }}</div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════
         RECENTLY VIEWED
    ══════════════════════════════════════════════════════ -->
    @if (recentlyViewedService.items().length > 0) {
      <section class="py-16 bg-white border-t" style="border-color: var(--color-border);">
        <div class="bb-container">
          <div class="mb-10 flex items-center justify-between">
            <div>
              <h2 class="section-title text-2xl flex items-center gap-2">
                Recently Viewed
              </h2>
              <p class="section-subtitle text-sm">Products you recently browsed</p>
            </div>
          </div>
          <div class="flex gap-6 overflow-x-auto pb-4" style="scrollbar-width: thin; scrollbar-color: var(--color-border) transparent;">
            @for (item of recentlyViewedService.items(); track $any(item)._id || $any(item).id) {
              <div class="flex-shrink-0 w-48 card p-3 bg-white flex flex-col justify-between hover-lift relative overflow-hidden group border" style="border-color: var(--color-border);">
                <a [routerLink]="['/products', $any(item).slug]" class="block h-full">
                  <div class="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-50 mb-3 relative">
                    <img [src]="$any(item).images?.[0] || '/assets/placeholder-product.jpg'" [alt]="$any(item).title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <h3 class="font-semibold text-xs text-neutral-900 group-hover:text-primary transition-colors truncate mb-1">{{ $any(item).title }}</h3>
                  <div class="flex items-baseline gap-1.5">
                    <span class="text-sm font-extrabold" style="color: var(--color-primary);">₹{{ ($any(item).discountPrice || $any(item).price) | number:'1.0-0' }}</span>
                    @if ($any(item).discountPrice && $any(item).price > $any(item).discountPrice) {
                      <span class="text-[10px] text-neutral-400 line-through">₹{{ $any(item).price | number:'1.0-0' }}</span>
                    }
                  </div>
                </a>
              </div>
            }
          </div>
        </div>
      </section>
    }

    <!-- ══════════════════════════════════════════════════════
         FEATURES / WHY US
    ══════════════════════════════════════════════════════ -->
    <section class="py-16" style="background: var(--color-bg-subtle);">
      <div class="bb-container">
        <div class="text-center mb-12">
          <h2 class="section-title">Why Happy Hamper?</h2>
          <p class="section-subtitle">We go the extra mile for your little one</p>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
          @for (f of features; track f.title) {
            <div class="text-center group">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 feature-icon-box">
                <svg class="w-8 h-8" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="f.svgPath"/>
                </svg>
              </div>
              <h3 class="font-semibold mb-2" style="color: var(--color-text);">{{ f.title }}</h3>
              <p class="text-sm leading-relaxed" style="color: var(--color-text-muted);">{{ f.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .category-item-icon {
      border: 2px solid var(--color-border);
      transition: border-color 0.25s, box-shadow 0.25s;
    }
    .group:hover .category-item-icon {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-warm);
    }
    .category-item-label {
      color: var(--color-text-muted);
    }
    .group:hover .category-item-label {
      color: var(--color-primary);
    }
    .promo-card {
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .promo-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.1);
    }
    .feature-icon-box {
      background: var(--color-primary-light);
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .group:hover .feature-icon-box {
      transform: scale(1.1);
      box-shadow: var(--shadow-warm);
    }
  `]
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  private cartStore = inject(CartStore);
  private wishlistStore = inject(WishlistStore);
  private authStore = inject(AuthStore);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private meta = inject(Meta);
  private titleService = inject(Title);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  readonly recentlyViewedService = inject(RecentlyViewedService);

  readonly newArrivals = signal<any[]>([]);
  readonly bestSellers = signal<any[]>([]);
  readonly loadingNewArrivals = signal(true);
  readonly loadingBestSellers = signal(true);

  readonly categories = signal<any[]>([]);
  readonly activeHero = signal<any | null>(null);
  readonly heroBanners = signal<any[]>([]);
  readonly activeHeroIndex = signal<number>(0);
  readonly middleBanners = signal<any[]>([]);

  // Showcase Signals
  readonly activeShowcaseCategoryId = signal<string>('');
  readonly showcaseProducts = signal<any[]>([]);
  readonly loadingShowcase = signal<boolean>(true);
  readonly comboProducts = signal<any[]>([]);

  readonly skeletons = Array(5).fill(0);

  // Category Icon & Color Mapping
  categoryStyleMap: Record<string, { color: string, iconColor: string, svgPath: string }> = {
    'jablas': { color: 'linear-gradient(135deg, #F0F1FA, #EAEBFA)', iconColor: 'var(--color-primary)', svgPath: 'M9 4L4 7v3h3v10h10V10h3V7l-5-3-3 2-3-2z' },
    'nappies-diapers': { color: 'linear-gradient(135deg, #FAF8F5, #F5EEE6)', iconColor: 'var(--color-accent)', svgPath: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707' },
    'swaddles-blankets': { color: 'linear-gradient(135deg, #FDFBF7, #FAF6EE)', iconColor: 'var(--color-primary)', svgPath: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
    'accessories': { color: 'linear-gradient(135deg, #F5F6FC, #EAEBFA)', iconColor: 'var(--color-primary)', svgPath: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    'combos': { color: 'linear-gradient(135deg, #F4F2F0, #EDE0D0)', iconColor: 'var(--color-accent)', svgPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  };

  defaultStyle = {
    color: 'linear-gradient(135deg, #F5F6FC, #EAEBFA)',
    iconColor: 'var(--color-primary)',
    svgPath: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
  };

  trustBadges = [
    { label: '100% Organic', sub: 'Certified cotton', color: 'var(--color-primary)', svgPath: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Free Shipping', sub: 'Orders ₹499+', color: 'var(--color-accent)', svgPath: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h5m4 0h5' },
    { label: 'Easy Returns', sub: '7-day hassle-free', color: 'var(--color-accent)', svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { label: 'Secure Payments', sub: 'SSL encrypted', color: 'var(--color-primary)', svgPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  ];

  testimonials = [
    { name: 'Priya Sharma', location: 'Mumbai, MH', text: 'The quality is absolutely amazing! My baby loves the Jablas and the fabric is so soft. Will definitely order again!' },
    { name: 'Ravi Kumar', location: 'Bengaluru, KA', text: 'Fast delivery and perfect packaging. The cotton swaddles are exactly as shown. Happy Hamper is my go-to for all baby clothing!' },
    { name: 'Anita Verma', location: 'Delhi, DL', text: 'Ordered the Newborn Starter Gift Box for my daughter — it looked stunning! The quality justifies every rupee spent.' },
    { name: 'Sunita Patel', location: 'Ahmedabad, GJ', text: 'Great range of sizes and styles. Love that they have organic cotton options. My newborn\'s skin is happy too!' },
    { name: 'Deepak Nair', location: 'Chennai, TN', text: 'Prompt customer service helped me with sizing. The 5-layer nappy fits perfectly. Really impressed with the overall experience.' },
    { name: 'Meera Joshi', location: 'Pune, MH', text: 'This is my 5th order! Every time the clothes are fresh, nicely packaged and super cute. My kids adore their Happy Hamper outfits!' },
  ];

  features = [
    { title: 'Organic Cotton', desc: 'Soft, breathable, and certified safe for sensitive baby skin.', svgPath: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z' },
    { title: 'Trendy Designs', desc: 'Curated styles inspired by global fashion trends for kids.', svgPath: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { title: 'Safety Tested', desc: 'All products tested for harmful substances, fully compliant.', svgPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { title: 'Eco-Friendly', desc: 'Reusable diapers and sustainable packaging options.', svgPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
  ];

  private heroIntervalId?: any;

  ngOnInit() {
    this.setupSEO();
    this.loadProducts();
    this.loadCategories();
    this.loadBanners();
  }

  ngOnDestroy() {
    this.stopHeroCarousel();
  }

  startHeroCarousel() {
    this.stopHeroCarousel();
    if (this.heroBanners().length > 1) {
      this.heroIntervalId = setInterval(() => {
        this.nextHero();
      }, 5000);
    }
  }

  stopHeroCarousel() {
    if (this.heroIntervalId) {
      clearInterval(this.heroIntervalId);
      this.heroIntervalId = undefined;
    }
  }

  nextHero() {
    const len = this.heroBanners().length;
    if (len <= 1) return;
    this.activeHeroIndex.update(idx => (idx + 1) % len);
    this.cdr.markForCheck();
  }

  prevHero() {
    const len = this.heroBanners().length;
    if (len <= 1) return;
    this.activeHeroIndex.update(idx => (idx - 1 + len) % len);
    this.cdr.markForCheck();
  }

  setHeroIndex(idx: number) {
    this.activeHeroIndex.set(idx);
    this.startHeroCarousel();
    this.cdr.markForCheck();
  }

  private setupSEO() {
    this.titleService.setTitle('Happy Hamper – Premium Organic Baby & Kids Clothing');
    this.meta.updateTag({ name: 'description', content: 'Shop adorable, organic, and safe clothing for babies and kids. Free shipping on orders above ₹499.' });
    this.meta.updateTag({ property: 'og:title', content: 'Happy Hamper – Premium Baby & Kids Clothing' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  private loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => {
        const raw = res.data || [];
        const mapped = raw.map((c: any) => {
          const slugKey = c.slug ? c.slug.toLowerCase() : '';
          const style = this.categoryStyleMap[slugKey] || this.defaultStyle;
          return {
            id: c._id || c.id,
            name: c.name,
            slug: c.slug || '',
            style: style
          };
        });
        this.categories.set(mapped);

        // Load default showcase products (Jablas)
        const defaultShowcase = mapped.find((c: any) => c.slug === 'jablas');
        if (defaultShowcase) {
          this.loadShowcaseProducts(defaultShowcase.id);
        }

        // Load combos
        const combosCat = mapped.find((c: any) => c.slug === 'combos');
        if (combosCat) {
          this.loadComboProducts(combosCat.id);
        }

        this.cdr.markForCheck();
      }
    });
  }

  private loadBanners() {
    // Fetch active hero banners
    this.http.get<any>(`${environment.apiUrl}/banners/active`, { params: { position: 'hero' } }).subscribe({
      next: (res) => {
        const list = res.data || [];
        this.heroBanners.set(list);
        this.activeHeroIndex.set(0);
        this.startHeroCarousel();
        this.cdr.markForCheck();
      }
    });

    // Fetch active middle promo strips
    const promoBgGradients = [
      'linear-gradient(135deg, var(--color-bluebell), var(--color-lavender))',
      'linear-gradient(135deg, var(--color-sandal), #C2B8B0)'
    ];

    this.http.get<any>(`${environment.apiUrl}/banners/active`, { params: { position: 'middle_banner' } }).subscribe({
      next: (res) => {
        const list = res.data || [];
        const mapped = list.map((b: any, index: number) => ({
          ...b,
          bg: promoBgGradients[index % promoBgGradients.length]
        }));
        this.middleBanners.set(mapped);
        this.cdr.markForCheck();
      }
    });
  }

  loadShowcaseProducts(categoryId: string) {
    this.activeShowcaseCategoryId.set(categoryId);
    this.loadingShowcase.set(true);
    this.cdr.markForCheck();

    this.productService.getAll({ category: categoryId, limit: 10 }).subscribe({
      next: (res) => {
        this.showcaseProducts.set(res.data || []);
        this.loadingShowcase.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.showcaseProducts.set([]);
        this.loadingShowcase.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  loadComboProducts(categoryId: string) {
    this.productService.getAll({ category: categoryId, limit: 3 }).subscribe({
      next: (res) => {
        this.comboProducts.set(res.data || []);
        this.cdr.markForCheck();
      }
    });
  }

  private loadProducts() {
    forkJoin({
      newArrivals: this.productService.getNewArrivals(10),
      bestSellers: this.productService.getBestSellers(10),
    }).subscribe({
      next: (res: any) => {
        this.newArrivals.set(res.newArrivals?.data || []);
        this.bestSellers.set(res.bestSellers?.data || []);
        this.loadingNewArrivals.set(false);
        this.loadingBestSellers.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingNewArrivals.set(false);
        this.loadingBestSellers.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  onQuickAdd(product: any) {
    if (!product.variants || product.variants.length === 0 || product.variants.length > 1) {
      this.router.navigate(['/products', product.slug]);
      return;
    }
    const defaultVariant = product.variants[0];
    if (defaultVariant && defaultVariant.sku) {
      this.cartStore.addItem(product._id || product.id, defaultVariant.sku, 1).subscribe();
    } else {
      this.router.navigate(['/products', product.slug]);
    }
  }

  isWishlisted(product: any): boolean {
    return this.wishlistStore.isInWishlist(product._id || product.id);
  }

  onToggleWishlist(event: Event, product: any) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.authStore.isLoggedIn()) {
      this.toastService.warning('Please log in to add items to your wishlist.');
      this.router.navigate(['/auth/login']);
      return;
    }
    this.wishlistStore.toggle(product._id || product.id).subscribe();
  }

  getRoutePath(linkString: string | null | undefined): string {
    if (!linkString) return '/products';
    return linkString.split('?')[0];
  }

  getRouteQueryParams(linkString: string | null | undefined, defaultParams: Record<string, any> = {}): Record<string, any> {
    if (!linkString) return defaultParams;
    const parts = linkString.split('?');
    if (parts.length < 2) return defaultParams;

    const params: Record<string, any> = {};
    const searchParams = new URLSearchParams(parts[1]);
    searchParams.forEach((value, key) => {
      if (value === 'true') {
        params[key] = true;
      } else if (value === 'false') {
        params[key] = false;
      } else {
        params[key] = value;
      }
    });
    return params;
  }
}
