import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, combineLatest } from 'rxjs';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductService } from '../../../../core/services/product.service';
import { CartStore } from '../../../../state/cart.store';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-product-listing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  template: `
    <div class="page-enter" style="background: var(--color-bg); min-height: 100vh;">

      <!-- Page Header Band -->
      <div class="py-4" style="background: var(--gradient-pastel); border-bottom: 1px solid var(--color-border);">
        <div class="bb-container">
          <!-- Breadcrumb -->
          <nav class="breadcrumb mb-3" aria-label="Breadcrumb">
            <a routerLink="/" class="hover:text-primary transition-colors">Home</a>
            <span class="breadcrumb-separator">›</span>
            <span style="color: var(--color-text);">{{ title() }}</span>
          </nav>
          <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 class="font-display text-3xl font-black tracking-tight" style="color: var(--color-text);">
                {{ title() }}
              </h1>
              <p class="text-sm mt-1" style="color: var(--color-text-muted);">
                @if (!loading()) {
                  Showing {{ products().length }} of {{ pagination().total || 0 }} products
                } @else {
                  Loading products...
                }
              </p>
            </div>
            <!-- Sort Controls & View Switcher -->
            <div class="flex items-center gap-3">
              <!-- Grid/List Switcher -->
              <div class="hidden sm:flex items-center border rounded-xl overflow-hidden bg-white" style="border-color: var(--color-border); height: 38px;">
                <button
                  (click)="viewMode.set('grid')"
                  [style.background]="viewMode() === 'grid' ? 'var(--color-primary-light)' : 'transparent'"
                  [style.color]="viewMode() === 'grid' ? 'var(--color-primary)' : 'var(--color-text-muted)'"
                  class="px-2.5 transition-colors flex items-center justify-center h-full hover:text-[var(--color-primary)] cursor-pointer"
                  aria-label="Grid view"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                  </svg>
                </button>
                <button
                  (click)="viewMode.set('list')"
                  [style.background]="viewMode() === 'list' ? 'var(--color-primary-light)' : 'transparent'"
                  [style.color]="viewMode() === 'list' ? 'var(--color-primary)' : 'var(--color-text-muted)'"
                  class="px-2.5 border-l transition-colors flex items-center justify-center h-full hover:text-[var(--color-primary)] cursor-pointer"
                  style="border-color: var(--color-border);"
                  aria-label="List view"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
              </div>

              <div class="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border" style="border-color: var(--color-border); height: 38px;">
                <svg class="w-4 h-4 flex-shrink-0" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
                </svg>
                <select
                  [(ngModel)]="selectedSort"
                  (change)="onFilterChange()"
                  class="text-sm font-medium outline-none bg-transparent cursor-pointer pr-1"
                  style="color: var(--color-text);"
                  aria-label="Sort products"
                >
                  <option value="-createdAt">Newest First</option>
                  <option value="price">Price: Low → High</option>
                  <option value="-price">Price: High → Low</option>
                  <option value="-salesCount">Best Sellers</option>
                  <option value="-rating">Top Rated</option>
                </select>
              </div>
              <!-- Mobile Filter Toggle -->
              <button
                (click)="showMobileFilters.set(true)"
                class="md:hidden flex items-center gap-2 btn-secondary py-2 px-4 text-sm cursor-pointer"
                aria-label="Open filters"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
                Filters
                @if (activeFilterCount() > 0) {
                  <span class="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center" style="background: var(--color-primary);">
                    {{ activeFilterCount() }}
                  </span>
                }
              </button>
            </div>
          </div>

          <!-- Active Filter Chips -->
          @if (activeFilterCount() > 0) {
            <div class="flex flex-wrap items-center gap-2 mt-4">
              <span class="text-xs font-semibold" style="color: var(--color-text-muted);">Active filters:</span>
              @if (bestSellerOnly) {
                <button
                  (click)="bestSellerOnly = false; onFilterChange()"
                  class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90"
                  style="background: var(--gradient-primary);"
                >
                  Best Sellers
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              }
              @if (newArrivalOnly) {
                <button
                  (click)="newArrivalOnly = false; onFilterChange()"
                  class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90"
                  style="background: var(--gradient-primary);"
                >
                  New Arrivals
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              }
              @if (featuredOnly) {
                <button
                  (click)="featuredOnly = false; onFilterChange()"
                  class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90"
                  style="background: var(--gradient-primary);"
                >
                  Featured
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              }
              @if (minPrice !== null || maxPrice !== null) {
                <button
                  (click)="minPrice = null; maxPrice = null; onFilterChange()"
                  class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90"
                  style="background: var(--gradient-accent);"
                >
                  Price: <i class="bi bi-currency-rupee"></i>{{ minPrice ?? 0 }} – <i class="bi bi-currency-rupee"></i>{{ maxPrice ?? '∞' }}
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              }
              <button (click)="resetFilters()" class="text-xs font-semibold underline transition-colors" style="color: var(--color-text-muted);">
                Clear all
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Main Content -->
      <div class="bb-container py-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">

          <!-- Sidebar Filters (Desktop) -->
          <aside class="hidden md:flex flex-col gap-5 col-span-1" aria-label="Product filters">
            <div class="card p-5">
              <button (click)="categoriesExpanded.set(!categoriesExpanded())" 
                      class="w-full flex items-center justify-between font-bold text-xs uppercase tracking-widest focus:outline-none" 
                      [class.mb-4]="categoriesExpanded()"
                      style="color: var(--color-text-muted);">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  Categories
                </span>
                <i class="pi text-[10px]" [class.pi-chevron-up]="categoriesExpanded()" [class.pi-chevron-down]="!categoriesExpanded()"></i>
              </button>
              
              @if (categoriesExpanded()) {
                <div class="space-y-1.5 animate-fade-in">
                  <a
                    routerLink="/products"
                    [queryParams]="{}"
                    class="flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200 category-filter-link"
                    [class.category-filter-active]="!activeCategorySlug()"
                    [class.category-filter-inactive]="!!activeCategorySlug()"
                  >
                    <span>All Products</span>
                    <svg class="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </a>
                  @for (cat of categories(); track cat.id || cat._id) {
                    <a
                      [routerLink]="['/category', cat.slug]"
                      [queryParamsHandling]="'merge'"
                      class="flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200 category-filter-link"
                      [class.category-filter-active]="activeCategorySlug() === cat.slug"
                      [class.category-filter-inactive]="activeCategorySlug() !== cat.slug"
                    >
                      <span>{{ cat.name }}</span>
                      <svg class="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </a>
                  }
                </div>
              }
            </div>

            <!-- Price Range Filter -->
            <div class="card p-5">
              <button (click)="priceExpanded.set(!priceExpanded())" 
                      class="w-full flex items-center justify-between font-bold text-xs uppercase tracking-widest focus:outline-none" 
                      [class.mb-4]="priceExpanded()"
                      style="color: var(--color-text-muted);">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Price Range
                </span>
                <i class="pi text-[10px]" [class.pi-chevron-up]="priceExpanded()" [class.pi-chevron-down]="!priceExpanded()"></i>
              </button>

              @if (priceExpanded()) {
                <div class="space-y-4 animate-fade-in">
                  <!-- Quick price buckets -->
                  <div class="flex flex-wrap gap-2">
                    @for (bucket of priceBuckets; track bucket.label) {
                      <button
                        (click)="applyPriceBucket(bucket.min, bucket.max)"
                        class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200"
                        [style]="(minPrice === bucket.min && maxPrice === bucket.max) ? 'background: var(--color-primary); color: white; border-color: var(--color-primary);' : 'background: white; color: var(--color-text-muted); border-color: var(--color-border);'"
                      >
                        {{ bucket.label }}
                      </button>
                    }
                  </div>
                  <!-- Custom range -->
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="text-[10px] font-semibold uppercase block mb-1" style="color: var(--color-text-muted);">Min (<i class="bi bi-currency-rupee"></i>)</label>
                      <input type="number" [(ngModel)]="minPrice" placeholder="0" class="input-field py-2 text-xs" />
                    </div>
                    <div>
                      <label class="text-[10px] font-semibold uppercase block mb-1" style="color: var(--color-text-muted);">Max (<i class="bi bi-currency-rupee"></i>)</label>
                      <input type="number" [(ngModel)]="maxPrice" placeholder="5000" class="input-field py-2 text-xs" />
                    </div>
                  </div>
                  <button (click)="onFilterChange()" class="btn-primary w-full py-2.5 text-xs">Apply Price</button>
                </div>
              }
            </div>

            <!-- Special Filters -->
            <div class="card p-5">
              <button (click)="specialExpanded.set(!specialExpanded())" 
                      class="w-full flex items-center justify-between font-bold text-xs uppercase tracking-widest focus:outline-none" 
                      [class.mb-4]="specialExpanded()"
                      style="color: var(--color-text-muted);">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                  Special
                </span>
                <i class="pi text-[10px]" [class.pi-chevron-up]="specialExpanded()" [class.pi-chevron-down]="!specialExpanded()"></i>
              </button>

              @if (specialExpanded()) {
                <div class="space-y-3 animate-fade-in">
                  @for (filter of specialFilters; track filter.key) {
                    <label class="flex items-center gap-3 cursor-pointer group">
                      <div class="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          [(ngModel)]="filterValues[filter.key]"
                          (change)="onSpecialFilterChange()"
                          class="sr-only"
                          [id]="'filter-' + filter.key"
                        />
                        <div class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                             [style]="filterValues[filter.key] ? 'background: var(--gradient-primary); border-color: var(--color-primary);' : 'border-color: var(--color-border); background: white;'">
                          @if (filterValues[filter.key]) {
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                            </svg>
                          }
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-neutral-700 group-hover:text-primary transition-colors">{{ filter.label }}</span>
                        <span class="text-xs px-1.5 py-0.5 rounded font-semibold" [style]="filter.badgeStyle">{{ filter.badge }}</span>
                      </div>
                    </label>
                  }
                </div>
              }
            </div>

            <!-- Age Group Filter -->
            <div class="card p-5">
              <button (click)="ageExpanded.set(!ageExpanded())" 
                      class="w-full flex items-center justify-between font-bold text-xs uppercase tracking-widest focus:outline-none" 
                      [class.mb-4]="ageExpanded()"
                      style="color: var(--color-text-muted);">
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Age Group
                </span>
                <i class="pi text-[10px]" [class.pi-chevron-up]="ageExpanded()" [class.pi-chevron-down]="!ageExpanded()"></i>
              </button>

              @if (ageExpanded()) {
                <div class="flex flex-wrap gap-2 animate-fade-in">
                  @for (age of ageGroups; track age.tag) {
                    <a
                      routerLink="/products"
                      [queryParams]="{tags: age.tag}"
                      class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105"
                      style="background: var(--color-primary-light); color: var(--color-primary); border-color: transparent;"
                    >
                      {{ age.label }}
                    </a>
                  }
                </div>
              }
            </div>
          </aside>

          <!-- Product Grid -->
          <div class="col-span-1 md:col-span-3">
            @if (loading()) {
              <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
                @for (s of [1,2,3,4,5,6,7,8,9]; track s) {
                  <div class="rounded-2xl overflow-hidden card">
                    <div class="skeleton aspect-[3/4] w-full rounded-none"></div>
                    <div class="p-4 space-y-3">
                      <div class="skeleton h-4 w-3/4 rounded-lg"></div>
                      <div class="skeleton h-4 w-1/2 rounded-lg"></div>
                      <div class="skeleton h-8 w-full rounded-xl"></div>
                    </div>
                  </div>
                }
              </div>
            } @else if (products().length === 0) {
              <!-- Empty state -->
              <div class="card p-16 text-center space-y-5 max-w-md mx-auto">
                <div class="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto" style="background: var(--color-primary-light);">
                  <svg class="w-10 h-10" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold mb-2" style="color: var(--color-text);">No products found</h3>
                  <p class="text-sm leading-relaxed" style="color: var(--color-text-muted);">
                    We couldn't find any products matching your filters. Try adjusting your search or clearing filters.
                  </p>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 justify-center">
                  <button (click)="resetFilters()" class="btn-primary py-2.5 px-6 text-sm">Clear All Filters</button>
                  <a routerLink="/products" class="btn-secondary py-2.5 px-6 text-sm">Browse All</a>
                </div>
              </div>
            } @else {
              <!-- Products Grid/List -->
              <div [class]="viewMode() === 'grid' ? 'grid grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in' : 'flex flex-col gap-4 animate-fade-in'">
                @for (p of products(); track p.id || p._id) {
                  <bb-product-card [product]="p" [viewMode]="viewMode()" (quickAdd)="onQuickAdd($event)" />
                }
              </div>

              <!-- Pagination -->
              @if (pagination().totalPages > 1) {
                <div class="flex items-center justify-center gap-2 pt-10">
                  <button
                    [disabled]="!pagination().hasPrevPage"
                    (click)="changePage(pagination().page - 1)"
                    class="w-10 h-10 rounded-xl flex items-center justify-center border font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                    style="border-color: var(--color-border); background: white; color: var(--color-text);"
                    aria-label="Previous page"
                  >
                    ‹
                  </button>

                  @for (page of getPageNumbers(); track page) {
                    @if (page === -1) {
                      <span class="text-neutral-400 px-1">…</span>
                    } @else {
                      <button
                        (click)="changePage(page)"
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all hover:scale-105"
                        [style]="pagination().page === page ? 'background: var(--gradient-primary); color: white; border: none;' : 'border: 1px solid var(--color-border); background: white; color: var(--color-text);'"
                        [attr.aria-label]="'Page ' + page"
                        [attr.aria-current]="pagination().page === page ? 'page' : null"
                      >
                        {{ page }}
                      </button>
                    }
                  }

                  <button
                    [disabled]="!pagination().hasNextPage"
                    (click)="changePage(pagination().page + 1)"
                    class="w-10 h-10 rounded-xl flex items-center justify-center border font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
                    style="border-color: var(--color-border); background: white; color: var(--color-text);"
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
                <p class="text-center text-xs mt-3" style="color: var(--color-text-muted);">
                  Page {{ pagination().page }} of {{ pagination().totalPages }}
                </p>
              }
            }
          </div>

        </div>
      </div>
    </div>

    <!-- Mobile Filters Drawer -->
    @if (showMobileFilters()) {
      <div
        class="fixed inset-0 z-50 flex justify-end animate-fade-in"
        style="background: rgba(0,0,0,0.45); backdrop-filter: blur(4px);"
        (click)="showMobileFilters.set(false)"
      >
        <div
          class="w-[340px] max-w-[90vw] h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-down"
          style="animation: slideFromRight 0.3s ease-out;"
          (click)="$event.stopPropagation()"
        >
          <!-- Drawer Header -->
          <div class="flex items-center justify-between px-6 py-4" style="border-bottom: 1px solid var(--color-border);">
            <div>
              <h2 class="font-bold text-lg" style="color: var(--color-text);">Filters</h2>
              @if (activeFilterCount() > 0) {
                <p class="text-xs mt-0.5" style="color: var(--color-text-muted);">{{ activeFilterCount() }} active</p>
              }
            </div>
            <button (click)="showMobileFilters.set(false)" class="btn-icon w-9 h-9" aria-label="Close filters">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Scrollable Content -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <!-- Categories -->
            <div>
              <h3 class="font-bold text-xs uppercase tracking-widest mb-3" style="color: var(--color-text-muted);">Category</h3>
              <div class="space-y-1">
                <a routerLink="/products" (click)="showMobileFilters.set(false)"
                   class="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
                   [class.category-filter-active]="!activeCategorySlug()"
                   [class.category-filter-inactive]="!!activeCategorySlug()">
                  All Products
                  @if (!activeCategorySlug()) { <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg> }
                </a>
                @for (cat of categories(); track cat.id || cat._id) {
                  <a [routerLink]="['/category', cat.slug]" (click)="showMobileFilters.set(false)"
                     class="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
                     [class.category-filter-active]="activeCategorySlug() === cat.slug"
                     [class.category-filter-inactive]="activeCategorySlug() !== cat.slug">
                    {{ cat.name }}
                    @if (activeCategorySlug() === cat.slug) { <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg> }
                  </a>
                }
              </div>
            </div>

            <!-- Price Range -->
            <div>
              <h3 class="font-bold text-xs uppercase tracking-widest mb-3" style="color: var(--color-text-muted);">Price Range</h3>
              <div class="flex flex-wrap gap-2 mb-3">
                @for (bucket of priceBuckets; track bucket.label) {
                  <button
                    (click)="applyPriceBucket(bucket.min, bucket.max)"
                    class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    [style]="(minPrice === bucket.min && maxPrice === bucket.max) ? 'background: var(--color-primary); color: white; border-color: var(--color-primary);' : 'background: white; color: var(--color-text-muted); border-color: var(--color-border);'"
                  >
                    {{ bucket.label }}
                  </button>
                }
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="number" [(ngModel)]="minPrice" [placeholder]="'Min ' + '\u20B9'" class="input-field py-2 text-sm" />
                <input type="number" [(ngModel)]="maxPrice" [placeholder]="'Max ' + '\u20B9'" class="input-field py-2 text-sm" />
              </div>
            </div>

            <!-- Special Filters -->
            <div>
              <h3 class="font-bold text-xs uppercase tracking-widest mb-3" style="color: var(--color-text-muted);">Special</h3>
              <div class="space-y-3">
                @for (filter of specialFilters; track filter.key) {
                  <label class="flex items-center gap-3 cursor-pointer">
                    <div class="relative flex-shrink-0">
                      <input type="checkbox" [(ngModel)]="filterValues[filter.key]" class="sr-only" />
                      <div class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                           [style]="filterValues[filter.key] ? 'background: var(--gradient-primary); border-color: var(--color-primary);' : 'border-color: var(--color-border); background: white;'">
                        @if (filterValues[filter.key]) {
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                        }
                      </div>
                    </div>
                    <span class="text-sm font-medium" style="color: var(--color-text);">{{ filter.label }}</span>
                  </label>
                }
              </div>
            </div>
          </div>

          <!-- Drawer Footer -->
          <div class="px-6 py-4 flex gap-3" style="border-top: 1px solid var(--color-border);">
            <button (click)="resetFilters(); showMobileFilters.set(false)" class="btn-secondary flex-1 py-3 text-sm">
              Clear All
            </button>
            <button (click)="onFilterChange(); showMobileFilters.set(false)" class="btn-primary flex-1 py-3 text-sm">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .category-filter-link { color: var(--color-text-muted); }
    .category-filter-active {
      background: var(--color-primary-light);
      color: var(--color-primary);
      font-weight: 600;
    }
    .category-filter-inactive:hover {
      background: var(--color-bg-subtle);
      color: var(--color-text);
    }
    @keyframes slideFromRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ProductListingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private productService = inject(ProductService);
  private cartStore = inject(CartStore);
  private cdr = inject(ChangeDetectorRef);

  private routeSub!: Subscription;

  title = signal<string>('All Products');
  categories = signal<any[]>([]);
  products = signal<any[]>([]);
  pagination = signal<any>({ page: 1, total: 0, totalPages: 1, hasPrevPage: false, hasNextPage: false });
  loading = signal<boolean>(true);
  showMobileFilters = signal<boolean>(false);
  activeCategorySlug = signal<string | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');

  // Collapse states for filter sections
  categoriesExpanded = signal<boolean>(true);
  priceExpanded = signal<boolean>(true);
  specialExpanded = signal<boolean>(true);
  ageExpanded = signal<boolean>(true);

  // Filter state
  selectedSort = '-createdAt';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  bestSellerOnly = false;
  newArrivalOnly = false;
  featuredOnly = false;
  currentPage = 1;

  // For template binding with ngModel
  filterValues: Record<string, boolean> = {
    bestSeller: false,
    newArrival: false,
    featured: false,
  };

  priceBuckets = [
    { label: 'Under \u20B9299', min: null, max: 299 },
    { label: '\u20B9299–\u20B9599', min: 299, max: 599 },
    { label: '\u20B9599–\u20B9999', min: 599, max: 999 },
    { label: '\u20B9999+', min: 999, max: null },
  ];

  specialFilters = [
    { key: 'bestSeller', label: 'Best Sellers', badge: '🔥 Hot', badgeStyle: 'background: #FEF3C7; color: #B45309;' },
    { key: 'newArrival', label: 'New Arrivals', badge: 'New ✨', badgeStyle: 'background: var(--color-primary-light); color: var(--color-primary);' },
    { key: 'featured', label: 'Featured Picks', badge: '⭐ Pick', badgeStyle: 'background: #F5F3FF; color: #7C3AED;' },
  ];

  ageGroups = [
    { label: '0–3 Months', tag: '0-3months' },
    { label: '3–6 Months', tag: '3-6months' },
    { label: '6–12 Months', tag: '6-12months' },
    { label: '12–24 Months', tag: '12-24months' },
  ];

  activeFilterCount = signal<number>(0);

  ngOnInit() {
    this.loadCategories();
    this.routeSub = combineLatest([this.route.params, this.route.queryParams]).subscribe(
      ([params, queryParams]) => {
        const slug = params['slug'];
        this.activeCategorySlug.set(slug || null);

        // Reset filters on route change
        this.bestSellerOnly = false;
        this.newArrivalOnly = false;
        this.featuredOnly = false;
        this.filterValues = { bestSeller: false, newArrival: false, featured: false };
        this.minPrice = null;
        this.maxPrice = null;

        if (queryParams['bestSeller']) { this.bestSellerOnly = true; this.filterValues['bestSeller'] = true; }
        if (queryParams['newArrival']) { this.newArrivalOnly = true; this.filterValues['newArrival'] = true; }
        if (queryParams['featured']) { this.featuredOnly = true; this.filterValues['featured'] = true; }

        // Title
        if (slug) {
          this.title.set(
            slug.split('-')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
          );
        } else {
          this.title.set('All Products');
        }

        this.currentPage = 1;
        this.updateActiveFilterCount();
        this.fetchProducts();
      }
    );
  }

  ngOnDestroy() {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
        this.cdr.markForCheck();
      },
    });
  }

  fetchProducts() {
    this.loading.set(true);
    this.cdr.markForCheck();

    const slug = this.activeCategorySlug();
    if (slug) {
      this.http.get<any>(`${environment.apiUrl}/categories/${slug}`).subscribe({
        next: (res) => this.loadProductsWithFilters(res.data?._id || res.data?.id),
        error: () => this.loadProductsWithFilters(),
      });
    } else {
      this.loadProductsWithFilters();
    }
  }

  private loadProductsWithFilters(categoryId?: string) {
    const params: any = {
      page: this.currentPage,
      limit: 12,
      sort: this.selectedSort,
    };

    if (categoryId) params.category = categoryId;
    if (this.minPrice) params.minPrice = this.minPrice;
    if (this.maxPrice) params.maxPrice = this.maxPrice;
    if (this.bestSellerOnly || this.filterValues['bestSeller']) params.bestSeller = true;
    if (this.newArrivalOnly || this.filterValues['newArrival']) params.newArrival = true;
    if (this.featuredOnly || this.filterValues['featured']) params.featured = true;

    const searchQuery = this.route.snapshot.queryParams['q'];
    if (searchQuery) params.search = searchQuery;

    this.productService.getAll(params).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.pagination.set(res.pagination || { page: 1, total: res.data?.length || 0, totalPages: 1 });
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.updateActiveFilterCount();
    this.fetchProducts();
  }

  onSpecialFilterChange() {
    this.bestSellerOnly = this.filterValues['bestSeller'];
    this.newArrivalOnly = this.filterValues['newArrival'];
    this.featuredOnly = this.filterValues['featured'];
    this.onFilterChange();
  }

  applyPriceBucket(min: number | null, max: number | null) {
    this.minPrice = min;
    this.maxPrice = max;
    this.onFilterChange();
  }

  resetFilters() {
    this.minPrice = null;
    this.maxPrice = null;
    this.bestSellerOnly = false;
    this.newArrivalOnly = false;
    this.featuredOnly = false;
    this.filterValues = { bestSeller: false, newArrival: false, featured: false };
    this.selectedSort = '-createdAt';
    this.currentPage = 1;
    this.activeFilterCount.set(0);
    this.fetchProducts();
  }

  changePage(page: number) {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.currentPage = page;
    this.fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    const total = this.pagination().totalPages;
    const current = this.pagination().page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  updateActiveFilterCount() {
    let count = 0;
    if (this.bestSellerOnly || this.filterValues['bestSeller']) count++;
    if (this.newArrivalOnly || this.filterValues['newArrival']) count++;
    if (this.featuredOnly || this.filterValues['featured']) count++;
    if (this.minPrice !== null || this.maxPrice !== null) count++;
    this.activeFilterCount.set(count);
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
}
