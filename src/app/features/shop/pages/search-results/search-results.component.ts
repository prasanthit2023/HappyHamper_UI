import { Component, OnInit, OnDestroy, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
    <div class="bb-container py-10 page-enter">
      <!-- Search Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-neutral-900 dark:text-white font-display">
          Search Results
        </h1>
        <p class="text-neutral-500 text-sm mt-1">
          Showing results for: <strong class="text-neutral-800 dark:text-neutral-250">"{{ query() }}"</strong>
        </p>
      </div>



      <!-- Products Grid -->
      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (s of [1,2,3,4]; track s) {
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
        <div class="card p-12 text-center text-neutral-400 space-y-4 max-w-lg mx-auto">
          <div class="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-300">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-neutral-800 dark:text-neutral-250">No matches found</h3>
          <p class="text-sm leading-relaxed max-w-xs mx-auto">
            We couldn't find any products matching your search term. Check spelling, try general terms, or look into category listings.
          </p>
          <a routerLink="/products" class="btn-secondary py-3.5 px-6 text-xs inline-block">Browse All Catalogues</a>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (p of products(); track p.id || p._id) {
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



  onQuickAdd(product: any) {
    if (product.variants?.length > 1) {
      this.router.navigate(['/products', product.slug]);
      return;
    }
    const defaultVariant = product.variants?.[0];
    const sku = defaultVariant ? defaultVariant.sku : product.sku;
    if (sku) {
      this.cartStore.addItem(product._id || product.id, sku, 1).subscribe();
    }
  }
}
