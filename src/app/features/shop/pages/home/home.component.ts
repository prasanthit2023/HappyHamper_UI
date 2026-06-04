import {
  Component,
  OnInit,
  signal,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductService } from '../../../../core/services/product.service';
import { CartStore } from '../../../../state/cart.store';
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
      <!-- Decorative blobs -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
           style="background: radial-gradient(circle, rgba(46,175,176,0.06) 0%, transparent 70%); transform: translate(20%, -20%);"></div>
      <div class="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full pointer-events-none"
           style="background: radial-gradient(circle, rgba(237,137,54,0.07) 0%, transparent 70%); transform: translate(-20%, 20%);"></div>

      <div class="bb-container relative z-10 py-12">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          
          <!-- Hero Text -->
          <div class="animate-slide-up">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 font-medium"
                 style="background: var(--color-primary-light); color: var(--color-primary-dark);">
              <svg class="w-4 h-4 animate-bounce-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
              New Season Collection 2025
            </div>
            
            <h1 class="font-display text-4xl lg:text-5xl xl:text-6xl font-black leading-[1.1] mb-6" style="color: var(--color-text);">
              {{ activeHero()?.title || 'Dress Your Little Ones in Pure Joy' }}
            </h1>
            
            <p class="text-base lg:text-lg mb-8 max-w-lg leading-relaxed" style="color: var(--color-text-muted);">
              {{ activeHero()?.subtitle || 'Adorable, comfortable, and safe clothing for babies and kids aged 0–14. Made with love, certified organic cotton, and lots of care.' }}
            </p>
            
            <div class="flex flex-wrap gap-4">
              <a [routerLink]="getRoutePath(activeHero()?.link || '/products')" [queryParams]="getRouteQueryParams(activeHero()?.link || '/products', {newArrival:true})" class="btn-primary text-base px-8 py-4" id="hero-shop-now">
                {{ activeHero()?.ctaText || 'Shop New Arrivals' }}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </a>
              <a routerLink="/products" [queryParams]="{bestSeller:true}" class="btn-secondary text-base px-8 py-4 inline-flex items-center gap-2">
                Best Sellers
                <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
                </svg>
              </a>
            </div>

            <!-- Trust badges -->
            <div class="flex flex-wrap gap-6 mt-10">
              @for (badge of trustBadges; track badge.label) {
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                    <svg class="w-5 h-5" [style.color]="badge.color" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="badge.svgPath"/>
                    </svg>
                  </div>
                  <div>
                    <div class="font-semibold text-sm" style="color: var(--color-text);">{{ badge.label }}</div>
                    <div class="text-xs" style="color: var(--color-text-muted);">{{ badge.sub }}</div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Hero Visual -->
          <div class="relative hidden lg:flex items-center justify-center">
            <div class="relative w-full max-w-[440px]">
              @if (activeHero()?.imageUrl) {
                <div class="relative rounded-3xl overflow-hidden shadow-float aspect-[4/5] bg-neutral-100 border border-beige">
                  <img [src]="activeHero()?.imageUrl" alt="Featured Season Collection" class="w-full h-full object-cover rounded-3xl" />
                </div>
              } @else {
                <!-- Fallback premium layout visual -->
                <div class="relative rounded-3xl overflow-hidden shadow-float aspect-[4/5]"
                     style="background: var(--gradient-pastel);">
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center space-y-4 px-8 w-full">
                      <div class="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-warm border border-white">
                        <img src="/logo.jpg" alt="Happy Hamper Logo" class="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 class="font-bold text-lg text-neutral-800">Organic Cotton</h3>
                        <p class="text-xs text-neutral-500">Curated with love and care</p>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- Floating stat cards -->
              <div class="absolute -left-10 top-12 card px-4 py-3 animate-fade-in shadow-float bg-white">
                <div class="text-2xl font-bold" style="color: var(--color-primary);">50K+</div>
                <div class="text-xs" style="color: var(--color-text-muted);">Happy families</div>
              </div>
              <div class="absolute -right-8 bottom-20 card px-4 py-3 animate-fade-in shadow-float bg-white" style="animation-delay:0.3s">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span class="font-bold text-sm" style="color: var(--color-text);">4.9/5</span>
                </div>
                <div class="text-xs" style="color: var(--color-text-muted);">Avg. rating</div>
              </div>
              <div class="absolute -left-4 bottom-14 card px-3 py-2 animate-fade-in shadow-float bg-white" style="animation-delay:0.6s">
                <div class="flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs" style="background: #DCFCE7; color: #16a34a;">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </span>
                  <span class="text-xs font-medium" style="color: var(--color-text);">100% Organic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════
         CATEGORY SLIDER
    ══════════════════════════════════════════════════════ -->
    <section class="py-14" style="background: white;">
      <div class="bb-container">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="section-title text-2xl">Shop by Category</h2>
            <p class="section-subtitle text-sm">Find the perfect fit for every age</p>
          </div>
          <a routerLink="/products" class="btn-ghost hidden sm:flex">
            View all
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>

        <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory font-sans" style="scrollbar-width: none;">
          @if (categories().length === 0) {
            <div class="w-full text-center py-6 text-neutral-400 text-xs">No active categories.</div>
          } @else {
            @for (cat of categories(); track cat.slug) {
              <a
                [routerLink]="['/category', cat.slug]"
                class="flex-shrink-0 snap-start flex flex-col items-center gap-3 group cursor-pointer"
                style="min-width: 110px;"
              >
                <div class="w-20 h-20 rounded-full overflow-hidden
                            group-hover:scale-105 transition-all duration-300 flex items-center justify-center category-item-icon"
                     [style.background]="cat.style.color">
                  <svg class="w-9 h-9" [style.color]="cat.style.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="cat.style.svgPath"/>
                  </svg>
                </div>
                <span class="text-sm font-medium text-center transition-colors category-item-label">
                  {{ cat.name }}
                </span>
              </a>
            }
          }
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════
         PROMOTIONS / BANNER STRIP
    ══════════════════════════════════════════════════════ -->
    @if (middleBanners().length > 0) {
      <section class="py-8" style="background: var(--color-bg);">
        <div class="bb-container">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (promo of middleBanners(); track promo._id) {
              <a [routerLink]="getRoutePath(promo.link || '/products')" 
                 [queryParams]="getRouteQueryParams(promo.link || '/products')"
                 class="relative rounded-2xl overflow-hidden h-36 flex items-center px-6 group cursor-pointer transition-all duration-300 hover:-translate-y-1 block promo-card"
                 [style.background]="promo.bg">
                <div class="relative z-10">
                  <p class="text-xs font-semibold text-white/80 uppercase tracking-widest mb-1">PROMOTION</p>
                  <h3 class="font-display font-bold text-white text-lg lg:text-xl leading-tight">{{ promo.title }}</h3>
                  <p class="text-white/70 text-xs mt-1 line-clamp-1">{{ promo.subtitle }}</p>
                  <span class="inline-flex items-center gap-1 text-white/90 text-sm mt-2 group-hover:gap-2 transition-all">
                    {{ promo.ctaText || 'Shop now' }}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </span>
                </div>
                <div class="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-300">
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
         NEW ARRIVALS
    ══════════════════════════════════════════════════════ -->
    <section class="py-16" style="background: white;">
      <div class="bb-container">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="section-title flex items-center gap-2">
              New Arrivals
              <svg class="w-6 h-6" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </h2>
            <p class="section-subtitle">Fresh drops just for you</p>
          </div>
          <a routerLink="/products" [queryParams]="{newArrival:true}" class="btn-secondary hidden sm:inline-flex text-sm">
            View all
          </a>
        </div>

        @if (loadingNewArrivals()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            @for (s of skeletons; track s) {
              <div class="rounded-2xl overflow-hidden card p-2 bg-white">
                <div class="skeleton aspect-[3/4] w-full rounded-2xl"></div>
                <div class="p-3 space-y-2">
                  <div class="skeleton h-4 w-3/4 rounded"></div>
                  <div class="skeleton h-4 w-1/2 rounded"></div>
                </div>
              </div>
            }
          </div>
        } @else if (newArrivals().length === 0) {
          <div class="text-center py-12 text-neutral-400 text-sm">No new products available.</div>
        } @else {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            @for (product of newArrivals(); track product._id) {
              <bb-product-card [product]="product" (quickAdd)="onQuickAdd($event)" />
            }
          </div>
        }
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════
         OFFER BANNER
    ══════════════════════════════════════════════════════ -->
    <section class="py-12" style="background: var(--color-bg-subtle);">
      <div class="bb-container">
        <div class="relative rounded-3xl overflow-hidden px-8 py-12 text-center shadow-float"
             style="background: linear-gradient(135deg, var(--color-teal) 0%, var(--color-green) 100%);">
          <!-- Background pattern -->
          <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px); background-size: 40px 40px;"></div>
          <div class="relative z-10">
            <p class="text-white/80 text-sm font-semibold uppercase tracking-widest mb-3">Limited Time Offer</p>
            <h2 class="font-display text-4xl lg:text-5xl font-black text-white mb-4">
              Up to <span style="color: #FEF3C7;">50% OFF</span>
            </h2>
            <p class="text-white/80 text-lg mb-8 max-w-lg mx-auto">
              Huge discounts on our most loved styles. Don't miss out on the biggest sale of the season!
            </p>
            <a routerLink="/products" [queryParams]="{onSale:true}"
               class="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-2xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
               style="background: white; color: var(--color-primary-dark);"
               id="offer-banner-cta">
              Shop Sale Now
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════
         BEST SELLERS
    ══════════════════════════════════════════════════════ -->
    <section class="py-16" style="background: var(--color-bg-subtle);">
      <div class="bb-container">
        <div class="flex items-center justify-between mb-10">
          <div>
            <h2 class="section-title flex items-center gap-2">
              Best Sellers
              <svg class="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
              </svg>
            </h2>
            <p class="section-subtitle">Most loved by our customers</p>
          </div>
          <a routerLink="/products" [queryParams]="{bestSeller:true}" class="btn-secondary hidden sm:inline-flex text-sm">
            View all
          </a>
        </div>

        @if (loadingBestSellers()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            @for (s of skeletons; track s) {
              <div class="rounded-2xl overflow-hidden card p-2 bg-white">
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
            <svg class="w-6 h-6" style="color: var(--color-pink);" fill="currentColor" viewBox="0 0 24 24">
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
                  <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
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
  private cartStore      = inject(CartStore);
  private meta           = inject(Meta);
  private titleService   = inject(Title);
  private cdr            = inject(ChangeDetectorRef);
  private http           = inject(HttpClient);

  readonly newArrivals        = signal<any[]>([]);
  readonly bestSellers        = signal<any[]>([]);
  readonly loadingNewArrivals = signal(true);
  readonly loadingBestSellers = signal(true);

  readonly categories         = signal<any[]>([]);
  readonly activeHero         = signal<any | null>(null);
  readonly middleBanners      = signal<any[]>([]);

  readonly skeletons = Array(5).fill(0);

  // Category Icon & Color Mapping
  categoryStyleMap: Record<string, { color: string, iconColor: string, svgPath: string }> = {
    newborn:     { color: 'linear-gradient(135deg, #EAF7F7, #EBF8FF)', iconColor: 'var(--color-primary)', svgPath: 'M12 3a6 6 0 00-6 6v3a4 4 0 004 4h4a4 4 0 004-4V9a6 6 0 00-6-6zM9 16v3a2 2 0 002 2h2a2 2 0 002-2v-3' },
    toddlers:    { color: 'linear-gradient(135deg, #FFF0E6, #FFE4E6)', iconColor: 'var(--color-orange)', svgPath: 'M8 5a3 3 0 100 6 3 3 0 000-6zm8 0a3 3 0 100 6 3 3 0 000-6zM12 8a8 8 0 100 16 8 8 0 000-16z' },
    girls:       { color: 'linear-gradient(135deg, #FDF2F8, #FCE7F3)', iconColor: 'var(--color-pink)', svgPath: 'M6 3h12l3 5-4 11H7L3 8l3-5zM12 3v5' },
    boys:        { color: 'linear-gradient(135deg, #EFF6FF, #E0F2FE)', iconColor: 'var(--color-teal)', svgPath: 'M9 4L4 7v3h3v10h10V10h3V7l-5-3-3 2-3-2z' },
    dresses:     { color: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', iconColor: 'var(--color-orange)', svgPath: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    sleepwear:   { color: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', iconColor: 'var(--color-purple)', svgPath: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
    ethnic:      { color: 'linear-gradient(135deg, #E6FFFA, #D7F9F1)', iconColor: 'var(--color-green)', svgPath: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    accessories: { color: 'linear-gradient(135deg, #FDF2F8, #FFE4E6)', iconColor: 'var(--color-pink)', svgPath: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
  };

  defaultStyle = {
    color: 'linear-gradient(135deg, #EAF7F7, #EBF8FF)',
    iconColor: 'var(--color-primary)',
    svgPath: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
  };

  trustBadges = [
    { label: '100% Organic',   sub: 'Certified cotton', color: 'var(--color-green)', svgPath: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Free Shipping',  sub: 'Orders ₹499+', color: 'var(--color-teal)', svgPath: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h5m4 0h5' },
    { label: 'Easy Returns',   sub: '7-day hassle-free', color: 'var(--color-orange)', svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { label: 'Secure Payments', sub: 'SSL encrypted', color: 'var(--color-purple)', svgPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  ];

  testimonials = [
    { name: 'Priya Sharma',  location: 'Mumbai, MH', text: 'The quality is absolutely amazing! My daughter loves her new dresses and the fabric is so soft. Will definitely order again!' },
    { name: 'Ravi Kumar',    location: 'Bengaluru, KA', text: 'Fast delivery and perfect packaging. The rompers for my son are exactly as shown. Happy Hamper is my go-to for all baby clothing!' },
    { name: 'Anita Verma',   location: 'Delhi, DL', text: 'Ordered 3 ethnic sets for my daughter\'s birthday — they looked stunning! The quality justifies every rupee spent.' },
    { name: 'Sunita Patel',  location: 'Ahmedabad, GJ', text: 'Great range of sizes and styles. Love that they have organic cotton options. My newborn\'s skin is happy too!' },
    { name: 'Deepak Nair',   location: 'Chennai, TN', text: 'Prompt customer service helped me with sizing. The tracksuit fits perfectly. Really impressed with the overall experience.' },
    { name: 'Meera Joshi',   location: 'Pune, MH', text: 'This is my 5th order! Every time the clothes are fresh, nicely packaged and super cute. My kids adore their Happy Hamper outfits!' },
  ];

  features = [
    { title: 'Organic Cotton',  desc: 'Soft, breathable, and certified safe for sensitive baby skin.', svgPath: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z' },
    { title: 'Trendy Designs',  desc: 'Curated styles inspired by global fashion trends for kids.', svgPath: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { title: 'Safety Tested',   desc: 'All products tested for harmful substances, fully compliant.', svgPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { title: 'Eco-Friendly',    desc: 'Sustainable packaging and ethical manufacturing processes.', svgPath: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
  ];

  ngOnInit() {
    this.setupSEO();
    this.loadProducts();
    this.loadCategories();
    this.loadBanners();
  }

  private setupSEO() {
    this.titleService.setTitle('Happy Hamper – Premium Organic Baby & Kids Clothing');
    this.meta.updateTag({ name: 'description', content: 'Shop adorable, organic, and safe clothing for babies and kids aged 0–14 years. Free shipping on orders above ₹499.' });
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
            name: c.name,
            slug: c.slug || '',
            style: style
          };
        });
        this.categories.set(mapped);
        this.cdr.markForCheck();
      }
    });
  }

  private loadBanners() {
    // Fetch active hero banners
    this.http.get<any>(`${environment.apiUrl}/banners/active`, { params: { position: 'hero' } }).subscribe({
      next: (res) => {
        const list = res.data || [];
        if (list.length > 0) {
          this.activeHero.set(list[0]);
        }
        this.cdr.markForCheck();
      }
    });

    // Fetch active middle promo strips
    const promoBgGradients = [
      'linear-gradient(135deg, var(--color-teal), var(--color-green))',
      'linear-gradient(135deg, var(--color-orange), var(--color-pink))',
      'linear-gradient(135deg, var(--color-purple), var(--color-pink))'
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

  private loadProducts() {
    forkJoin({
      newArrivals:  this.productService.getNewArrivals(10),
      bestSellers:  this.productService.getBestSellers(10),
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
    if (product.variants?.length > 1) return;
    const defaultVariant = product.variants?.[0];
    if (defaultVariant) {
      this.cartStore.addItem(product._id, defaultVariant.sku, 1).subscribe();
    }
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
