import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { HttpClient as HttpService } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="card p-6 space-y-6 page-enter">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">Products Management</h2>
          <p class="text-neutral-500 text-xs mt-1">Add, update, and toggle publishing of your catalog listings</p>
        </div>
        <a routerLink="/admin/products/new" class="btn-primary text-xs py-2.5 px-4 font-bold">
          + Add Product
        </a>
      </div>

      <!-- Search and Filters bar -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-50/50 dark:bg-neutral-800/30 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
        <!-- Search input -->
        <div class="relative">
          <input
            type="text"
            placeholder="Search by title, SKU..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            class="input-field py-2.5 pl-9 text-xs"
          />
          <svg class="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>

        <!-- Status Filter -->
        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event)"
          class="input-field py-2 text-xs cursor-pointer"
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published Only</option>
          <option value="draft">Drafts Only</option>
        </select>

        <!-- Category Filter -->
        <select
          [ngModel]="categoryFilter()"
          (ngModelChange)="categoryFilter.set($event)"
          class="input-field py-2 text-xs cursor-pointer"
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          @for (cat of categories(); track cat._id) {
            <option [value]="cat._id">{{ cat.name }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-16 w-full rounded-2xl"></div>
          <div class="skeleton h-16 w-full rounded-2xl"></div>
        </div>
      } @else if (products().length === 0) {
        <div class="text-center py-12 text-neutral-400">
          No products in database. Add one to get started.
        </div>
      } @else if (filteredProducts().length === 0) {
        <div class="text-center py-12 text-neutral-400 text-sm">
          No products match your filters. Try clearing search or filters.
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <th class="py-3 px-4">Product Info</th>
                <th class="py-3 px-4">SKU</th>
                <th class="py-3 px-4">Price</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-200">
              @for (p of filteredProducts(); track p._id) {
                <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <img [src]="p.images?.[0] || '/assets/placeholder-product.jpg'" class="w-10 h-10 object-cover rounded-lg bg-neutral-50" [alt]="p.title" />
                      <div>
                        <span class="font-bold text-neutral-800 dark:text-white block">{{ p.title }}</span>
                        <span class="text-[10px] text-neutral-400 uppercase font-medium">{{ p.categoryId?.name }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 font-mono text-xs">{{ p.sku }}</td>
                  <td class="py-3 px-4 font-semibold">₹{{ p.price }}</td>
                  <td class="py-3 px-4">
                    <button
                      (click)="togglePublish(p._id)"
                      [class.bg-emerald-500]="p.isPublished"
                      [class.bg-neutral-300]="!p.isPublished"
                      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                      [attr.aria-label]="p.isPublished ? 'Unpublish product' : 'Publish product'"
                    >
                      <span
                        [class.translate-x-5]="p.isPublished"
                        [class.translate-x-0]="!p.isPublished"
                        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
                      ></span>
                    </button>
                    <span class="text-xs text-neutral-400 ml-2 select-none">
                      {{ p.isPublished ? 'Published' : 'Draft' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right space-x-2">
                    <a [routerLink]="['/admin/products', p._id, 'edit']" class="text-xs font-semibold text-primary-500 hover:underline">
                      Edit
                    </a>
                    <button (click)="deleteProduct(p._id)" class="text-xs font-semibold text-red-500 hover:underline cursor-pointer">
                      Delete
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private http = inject(HttpService);
  private cdr = inject(ChangeDetectorRef);

  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  loading = signal<boolean>(true);

  // Filter signals
  searchTerm = signal<string>('');
  statusFilter = signal<string>('all');
  categoryFilter = signal<string>('all');

  filteredProducts = computed(() => {
    let list = this.products();
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const category = this.categoryFilter();

    if (search) {
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search)
      );
    }

    if (status !== 'all') {
      const isPublished = status === 'published';
      list = list.filter((p) => p.isPublished === isPublished);
    }

    if (category !== 'all') {
      list = list.filter(
        (p) => (p.categoryId?._id || p.categoryId) === category
      );
    }

    return list;
  });

  ngOnInit() {
    this.fetchProducts();
    this.fetchCategories();
  }

  fetchProducts() {
    this.loading.set(true);
    this.productService.getAll({ limit: 100, includeDrafts: true }).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  fetchCategories() {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  togglePublish(id: string) {
    this.http.patch<any>(`${environment.apiUrl}/products/${id}/publish`, {}).subscribe({
      next: (res) => {
        const newStatus = res.data?.isPublished !== undefined ? res.data.isPublished : res.isPublished;
        this.products.update((list) =>
          list.map((p) => (p._id === id ? { ...p, isPublished: newStatus } : p))
        );
        this.cdr.markForCheck();
      },
    });
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.http.delete<any>(`${environment.apiUrl}/products/${id}`).subscribe({
        next: () => {
          this.products.update((list) => list.filter((p) => p._id !== id));
          this.cdr.markForCheck();
        },
      });
    }
  }
}
