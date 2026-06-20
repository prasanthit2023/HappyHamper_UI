import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { ProductService } from '../../../../core/services/product.service';
import { CartStore } from '../../../../state/cart.store';

@Component({
  selector: 'bb-search-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  template: `
    <div class="bb-container py-10 page-enter animate-fade-in">
      <!-- Search Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6 mb-8">
        <div>
          <h1 class="text-3xl font-extrabold text-[var(--color-text)] font-display">
            Search Results
          </h1>
          <p class="text-[var(--color-text-muted)] text-sm mt-1">
            @if (loading()) {
              Searching for: <strong class="text-[var(--color-text)]">"{{ query() }}"</strong>
            } @else {
              Showing {{ products().length }} {{ products().length === 1 ? 'result' : 'results' }} for: <strong class="text-[var(--color-text)]">"{{ query() }}"</strong>
            }
          </p>
        </div>
        
        <!-- Sort Dropdown -->
        @if (products().length > 0 && !loading()) {
          <div class="flex items-center gap-2 self-start sm:self-auto">
            <label for="sortBy" class="text-xs font-bold text-[var(--color-text-muted)] whitespace-nowrap">Sort By:</label>
            <select
              id="sortBy"
              [ngModel]="sortBy()"
              (ngModelChange)="sortBy.set($event)"
              class="py-2 px-3 pr-8 text-xs font-semibold rounded-xl bg-white border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text)] cursor-pointer"
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-Z</option>
            </select>
          </div>
        }
      </div>

      <!-- Products Grid -->
      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (s of [1,2,3,4]; track s) {
            <div class="rounded-2xl overflow-hidden card p-2 bg-white">
              <div class="skeleton aspect-[3/4] w-full rounded-2xl"></div>
              <div class="p-3 space-y-2">
                <div class="skeleton h-4 w-3/4 rounded"></div>
                <div class="skeleton h-4 w-1/2 rounded"></div>
              </div>
            </div>
          }
        </div>
      } @else if (products().length === 0) {
        <div class="card p-12 text-center text-[var(--color-text-muted)] space-y-6 max-w-lg mx-auto bg-white">
          <div class="w-16 h-16 bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mx-auto text-[var(--color-primary)] shadow-sm">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div class="space-y-2">
            <h3 class="text-lg font-bold text-[var(--color-text)]">No matches found</h3>
            <p class="text-sm leading-relaxed max-w-xs mx-auto">
              We couldn't find any products matching your search term. Check spelling or try searching another keyword.
            </p>
          </div>

          <!-- Inline Search Input -->
          <div class="max-w-md mx-auto relative">
            <input
              type="text"
              [(ngModel)]="newSearchQuery"
              (keyup.enter)="onInlineSearch()"
              placeholder="Search something else..."
              class="py-3 pl-4 pr-24 rounded-2xl w-full border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none text-sm text-[var(--color-text)]"
            />
            <button
              (click)="onInlineSearch()"
              class="absolute right-1.5 top-1.5 bottom-1.5 btn-primary py-1 px-4 text-xs font-bold rounded-xl"
            >
              Search
            </button>
          </div>

          <!-- Popular Categories & Tags -->
          <div class="space-y-3 pt-2">
            <p class="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Popular Suggestions</p>
            <div class="flex flex-wrap justify-center gap-2">
              <a routerLink="/products" [queryParams]="{ category: 'Hampers' }" class="text-xs bg-[var(--color-accent-light)] hover:bg-[var(--color-border)] text-[var(--color-text)] px-3 py-1.5 rounded-full font-semibold transition-colors">Gift Hampers</a>
              <a routerLink="/products" [queryParams]="{ category: 'Toys' }" class="text-xs bg-[var(--color-accent-light)] hover:bg-[var(--color-border)] text-[var(--color-text)] px-3 py-1.5 rounded-full font-semibold transition-colors">Soft Toys</a>
              <a routerLink="/products" [queryParams]="{ category: 'Clothing' }" class="text-xs bg-[var(--color-accent-light)] hover:bg-[var(--color-border)] text-[var(--color-text)] px-3 py-1.5 rounded-full font-semibold transition-colors">Baby Clothing</a>
              <a routerLink="/products" [queryParams]="{ category: 'Feeding' }" class="text-xs bg-[var(--color-accent-light)] hover:bg-[var(--color-border)] text-[var(--color-text)] px-3 py-1.5 rounded-full font-semibold transition-colors">Feeding Essentials</a>
            </div>
          </div>
          
          <div class="border-t border-[var(--color-border)] pt-4">
            <a routerLink="/products" class="text-sm font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1.5">
              <span>View All Catalogues</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (p of sortedProducts(); track (p.id || p._id)) {
            <bb-product-card [product]="p" (quickAdd)="onQuickAdd($event)" />
          }
        </div>
      }
    </div>
  `,
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartStore = inject(CartStore);
  private cdr = inject(ChangeDetectorRef);

  private querySub!: Subscription;

  query = signal<string>('');
  products = signal<any[]>([]);
  loading = signal<boolean>(true);
  sortBy = signal<string>('relevance');
  newSearchQuery: string = '';

  sortedProducts = computed(() => {
    const list = [...this.products()];
    const sortVal = this.sortBy();
    if (sortVal === 'price-asc') {
      return list.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-desc') {
      return list.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'name-asc') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortVal === 'name-desc') {
      return list.sort((a, b) => b.title.localeCompare(a.title));
    }
    return list;
  });

  ngOnInit() {
    this.querySub = this.route.queryParams.subscribe((queryParams) => {
      const q = queryParams['q'] || '';
      this.query.set(q);
      this.executeSearch(q);
    });
  }

  ngOnDestroy() {
    if (this.querySub) this.querySub.unsubscribe();
  }

  executeSearch(q: string) {
    if (!q) {
      this.products.set([]);
      this.loading.set(false);
      this.cdr.markForCheck();
      return;
    }

    this.loading.set(true);
    this.cdr.markForCheck();

    this.productService.search(q).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
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

  onInlineSearch() {
    if (this.newSearchQuery.trim()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: this.newSearchQuery },
        queryParamsHandling: 'merge'
      });
      this.newSearchQuery = '';
    }
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
