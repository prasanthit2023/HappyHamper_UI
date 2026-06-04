import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription, forkJoin } from 'rxjs';
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
    <div class="bb-container py-8 page-enter">
      <!-- Breadcrumb / Header -->
      <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-neutral-900 dark:text-white font-display tracking-tight">
            {{ title() }}
          </h1>
          <p class="text-neutral-500 text-sm mt-1">
            Showing {{ products().length }} of {{ pagination().total || 0 }} products
          </p>
        </div>

        <!-- Sort and Controls -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-neutral-500">Sort:</span>
            <select
              [(ngModel)]="selectedSort"
              (change)="onFilterChange()"
              class="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm focus:outline-none dark:text-neutral-200"
            >
              <option value="-createdAt">Newest Arrivals</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-salesCount">Best Sellers</option>
              <option value="-rating">Highest Rated</option>
            </select>
          </div>

          <!-- Mobile Filter Trigger -->
          <button (click)="showMobileFilters.set(true)" class="md:hidden inline-flex items-center gap-2 btn-icon px-4 py-2 text-sm rounded-xl">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
            Filters
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Sidebar Filters (Desktop) -->
        <aside class="hidden md:block col-span-1 space-y-6">
          <!-- Categories Filter -->
          <div class="card p-5 space-y-4">
            <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Categories</h3>
            <div class="space-y-2">
              <a
                routerLink="/products"
                [queryParams]="{}"
                [class.text-primary-500]="!activeCategorySlug()"
                [class.font-semibold]="!activeCategorySlug()"
                class="block text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-500 transition-colors"
              >
                All Products
              </a>
              @for (cat of categories(); track cat._id) {
                <a
                  [routerLink]="['/category', cat.slug]"
                  [queryParamsHandling]="'merge'"
                  [class.text-primary-500]="activeCategorySlug() === cat.slug"
                  [class.font-semibold]="activeCategorySlug() === cat.slug"
                  class="block text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-500 transition-colors"
                >
                  {{ cat.name }}
                </a>
              }
            </div>
          </div>

          <!-- Price Filter -->
          <div class="card p-5 space-y-4">
            <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Price Range</h3>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-[10px] text-neutral-400 block mb-1">Min Price (₹)</label>
                <input type="number" [(ngModel)]="minPrice" placeholder="0" class="input-field py-2" />
              </div>
              <div>
                <label class="text-[10px] text-neutral-400 block mb-1">Max Price (₹)</label>
                <input type="number" [(ngModel)]="maxPrice" placeholder="2000" class="input-field py-2" />
              </div>
            </div>
            <button (click)="onFilterChange()" class="btn-primary w-full py-2.5 text-xs">Apply Range</button>
          </div>

          <!-- Specific Tags / Labels -->
          <div class="card p-5 space-y-4">
            <h3 class="font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider">Special Items</h3>
            <div class="space-y-3">
              <label class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input type="checkbox" [(ngModel)]="bestSellerOnly" (change)="onFilterChange()" class="rounded text-primary-500 focus:ring-primary-500" />
                Best Sellers
              </label>
              <label class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input type="checkbox" [(ngModel)]="newArrivalOnly" (change)="onFilterChange()" class="rounded text-primary-500 focus:ring-primary-500" />
                New Arrivals
              </label>
              <label class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input type="checkbox" [(ngModel)]="featuredOnly" (change)="onFilterChange()" class="rounded text-primary-500 focus:ring-primary-500" />
                Featured Picks
              </label>
            </div>
          </div>
        </aside>

        <!-- Product Grid -->
        <div class="col-span-1 md:col-span-3 space-y-8">
          @if (loading()) {
            <!-- Skeleton Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
              @for (s of [1,2,3,4,5,6]; track s) {
                <div class="rounded-2xl overflow-hidden card p-2">
                  <div class="skeleton aspect-[3/4] w-full rounded-2xl"></div>
                  <div class="p-3 space-y-2">
                    <div class="skeleton h-4 w-3/4 rounded"></div>
                    <div class="skeleton h-4 w-1/2 rounded"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (products().length === 0) {
            <!-- Empty state -->
            <div class="card p-12 text-center text-neutral-400 space-y-4">
              <div class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 text-neutral-300 rounded-full flex items-center justify-center mx-auto">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200">No products found</h3>
              <p class="text-sm max-w-xs mx-auto">We couldn't find any products matching your filters. Try adjusting price range or select another category.</p>
              <button (click)="resetFilters()" class="btn-secondary py-2 text-xs">Clear All Filters</button>
            </div>
          } @else {
            <!-- Products Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
              @for (p of products(); track p._id) {
                <bb-product-card [product]="p" (quickAdd)="onQuickAdd($event)" />
              }
            </div>

            <!-- Pagination -->
            @if (pagination().totalPages > 1) {
              <div class="flex items-center justify-center gap-2 pt-6">
                <button
                  [disabled]="!pagination().hasPrevPage"
                  (click)="changePage(pagination().page - 1)"
                  class="btn-icon w-9 h-9 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &larr;
                </button>
                <span class="text-sm text-neutral-500 font-medium px-4">
                  Page {{ pagination().page }} of {{ pagination().totalPages }}
                </span>
                <button
                  [disabled]="!pagination().hasNextPage"
                  (click)="changePage(pagination().page + 1)"
                  class="btn-icon w-9 h-9 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  &rarr;
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>

    <!-- Mobile Filters Drawer -->
    @if (showMobileFilters()) {
      <div class="fixed inset-0 z-50 flex justify-end animate-fade-in bg-black/40 backdrop-blur-xs">
        <div class="w-80 h-full bg-white dark:bg-neutral-900 p-6 shadow-xl flex flex-col justify-between overflow-y-auto">
          <div>
            <div class="flex items-center justify-between mb-6 border-b pb-4">
              <h2 class="font-bold text-lg text-neutral-900 dark:text-white">Filters</h2>
              <button (click)="showMobileFilters.set(false)" class="btn-icon w-8 h-8" aria-label="Close filters"><i class="pi pi-times"></i></button>
            </div>

            <div class="space-y-6">
              <!-- Categories -->
              <div>
                <h3 class="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-3">Categories</h3>
                <div class="space-y-2">
                  <a
                    routerLink="/products"
                    (click)="showMobileFilters.set(false)"
                    [class.text-primary-500]="!activeCategorySlug()"
                    class="block text-sm"
                  >
                    All Products
                  </a>
                  @for (cat of categories(); track cat._id) {
                    <a
                      [routerLink]="['/category', cat.slug]"
                      (click)="showMobileFilters.set(false)"
                      [class.text-primary-500]="activeCategorySlug() === cat.slug"
                      class="block text-sm"
                    >
                      {{ cat.name }}
                    </a>
                  }
                </div>
              </div>

              <!-- Price -->
              <div>
                <h3 class="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-3">Price Range</h3>
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <input type="number" [(ngModel)]="minPrice" placeholder="Min" class="input-field py-2" />
                  <input type="number" [(ngModel)]="maxPrice" placeholder="Max" class="input-field py-2" />
                </div>
              </div>

              <!-- Special Items -->
              <div>
                <h3 class="font-bold text-xs uppercase tracking-wider text-neutral-400 mb-3">Filter Special</h3>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" [(ngModel)]="bestSellerOnly" /> Best Sellers
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" [(ngModel)]="newArrivalOnly" /> New Arrivals
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" [(ngModel)]="featuredOnly" /> Featured Picks
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t pt-4 flex gap-4 mt-6">
            <button (click)="resetFilters(); showMobileFilters.set(false)" class="btn-secondary flex-1 py-3">Clear</button>
            <button (click)="onFilterChange(); showMobileFilters.set(false)" class="btn-primary flex-1 py-3">Apply</button>
          </div>
        </div>
      </div>
    }
  `,
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
  pagination = signal<any>({ page: 1, total: 0, totalPages: 1 });
  loading = signal<boolean>(true);
  showMobileFilters = signal<boolean>(false);

  // Filter States
  activeCategorySlug = signal<string | null>(null);
  selectedSort = '-createdAt';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  bestSellerOnly = false;
  newArrivalOnly = false;
  featuredOnly = false;

  currentPage = 1;

  ngOnInit() {
    this.loadCategories();
    this.routeSub = this.route.params.subscribe((params) => {
      const slug = params['slug'];
      this.activeCategorySlug.set(slug || null);

      // Check query parameters (like sale, bestSeller, search)
      const queryParams = this.route.snapshot.queryParams;
      if (queryParams['bestSeller']) this.bestSellerOnly = true;
      if (queryParams['newArrival']) this.newArrivalOnly = true;
      if (queryParams['onSale']) this.maxPrice = 1000; // Simulated sale limit
      if (queryParams['q']) {
        // Search trigger
        this.title.set(`Search results for: "${queryParams['q']}"`);
      } else if (slug) {
        this.title.set(slug.charAt(0).toUpperCase() + slug.slice(1));
      } else {
        this.title.set('All Products');
      }

      this.fetchProducts();
    });
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

    // First find matching Category ID from slug if it's set
    const slug = this.activeCategorySlug();
    if (slug) {
      this.http.get<any>(`${environment.apiUrl}/categories/${slug}`).subscribe({
        next: (res) => {
          const categoryId = res.data?._id || res.data?.id;
          this.loadProductsWithFilters(categoryId);
        },
        error: () => {
          this.loadProductsWithFilters();
        },
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

    // Search query param
    const searchQuery = this.route.snapshot.queryParams['q'];
    if (searchQuery) params.search = searchQuery;

    if (this.minPrice !== null && this.minPrice !== undefined) params.minPrice = this.minPrice;
    if (this.maxPrice !== null && this.maxPrice !== undefined) params.maxPrice = this.maxPrice;

    if (this.bestSellerOnly) params.bestSeller = true;
    if (this.newArrivalOnly) params.newArrival = true;
    if (this.featuredOnly) params.featured = true;

    this.productService.getAll(params).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.pagination.set(res.pagination || { page: 1, total: res.data.length, totalPages: 1 });
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
    this.fetchProducts();
  }

  resetFilters() {
    this.minPrice = null;
    this.maxPrice = null;
    this.bestSellerOnly = false;
    this.newArrivalOnly = false;
    this.featuredOnly = false;
    this.selectedSort = '-createdAt';
    this.currentPage = 1;
    this.fetchProducts();
  }

  changePage(page: number) {
    this.currentPage = page;
    this.fetchProducts();
  }

  onQuickAdd(product: any) {
    if (product.variants?.length > 1) {
      this.router.navigate(['/products', product.slug]);
      return;
    }
    const defaultVariant = product.variants?.[0];
    if (defaultVariant) {
      this.cartStore.addItem(product._id || product.id, defaultVariant.sku, 1).subscribe();
    }
  }
}
