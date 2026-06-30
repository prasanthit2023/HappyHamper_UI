import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../core/services/product.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'bb-admin-products',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="card p-6 space-y-5 animate-fade-in">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-header-title">Products</h2>
          <p class="page-header-sub">{{ products().length }} products · {{ publishedCount() }} published, {{ draftCount() }} drafts</p>
        </div>
        <div class="page-header-actions">
          <a routerLink="/admin/products/new" class="btn-primary text-xs py-2.5 px-4 gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Product
          </a>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="relative">
          <input
            type="text"
            placeholder="Search by title, SKU..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            class="input-field py-2.5 pl-9 text-xs"
          />
          <svg class="w-4 h-4 absolute left-3 top-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)"
                class="input-field py-2.5 text-xs cursor-pointer" aria-label="Filter by status">
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event)"
                class="input-field py-2.5 text-xs cursor-pointer" aria-label="Filter by category">
          <option value="all">All Categories</option>
          @for (cat of categories(); track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
        </select>
      </div>

      <!-- Bulk Action Bar -->
      @if (selectedIds().length > 0) {
        <div class="bulk-bar">
          <span class="font-semibold">{{ selectedIds().length }} selected</span>
          <div class="flex items-center gap-2 ml-auto">
            <button (click)="bulkPublish(true)"  class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background: #D1FAE5; color: #065F46;">Publish All</button>
            <button (click)="bulkPublish(false)" class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background: #F3F4F6; color: #374151;">Unpublish All</button>
            <button (click)="bulkDelete()"       class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background: #FEE2E2; color: #991B1B;">Delete Selected</button>
            <button (click)="selectedIds.set([])" class="text-xs px-2 py-1.5 text-neutral-500 hover:text-neutral-700">✕ Clear</button>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="skeleton h-16 w-full rounded-xl"></div>
          }
        </div>
      } @else if (products().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
            </svg>
          </div>
          <div class="empty-state-title">No products yet</div>
          <div class="empty-state-sub">Create your first product to start selling.</div>
          <div class="empty-state-action">
            <a routerLink="/admin/products/new" class="btn-primary text-sm">Add Product</a>
          </div>
        </div>
      } @else if (filteredProducts().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div class="empty-state-title">No results</div>
          <div class="empty-state-sub">No products match your current filters. Try clearing your search.</div>
        </div>
      } @else {
        <div class="w-full overflow-x-auto rounded-xl border" style="border-color: var(--color-border);">
          <table class="admin-table">
            <thead>
              <tr>
                <th class="w-10">
                  <input type="checkbox"
                         [checked]="allSelected()"
                         (change)="toggleAll($event)"
                         class="rounded cursor-pointer"
                         style="accent-color: var(--color-primary);"
                         aria-label="Select all" />
                </th>
                <th>Product</th>
                <th>SKU</th>
                <th class="sortable" (click)="sortBy('price')">
                  Price {{ sortField() === 'price' ? (sortAsc() ? '↑' : '↓') : '' }}
                </th>
                <th class="sortable" (click)="sortBy('stock')">
                  Stock {{ sortField() === 'stock' ? (sortAsc() ? '↑' : '↓') : '' }}
                </th>
                <th>Status</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filteredProducts(); track p.id) {
                <tr [class.bg-primary-50]="isSelected(p.id)">
                  <td>
                    <input type="checkbox"
                           [checked]="isSelected(p.id)"
                           (change)="toggleSelect(p.id)"
                           class="rounded cursor-pointer"
                           style="accent-color: var(--color-primary);"
                           [attr.aria-label]="'Select ' + p.title" />
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                       <img [src]="p.images?.[0] || '/assets/placeholder-product.svg'"
                            (error)="$any($event.target).src='/assets/placeholder-product.svg'"
                            class="w-12 h-12 object-cover rounded-xl flex-shrink-0 border"
                            style="border-color: var(--color-border);"
                            [alt]="p.title" />
                      <div class="min-w-0">
                        <span class="font-semibold text-sm block truncate max-w-[180px]" 
                              style="color: var(--color-text);" 
                              [title]="p.title">
                          {{ p.title }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td><span class="font-mono text-xs" style="color: var(--color-text-muted);">{{ p.sku || '—' }}</span></td>
                  <td class="font-semibold text-sm" style="color: var(--color-text);">₹{{ p.price }}</td>
                  <td>
                    <span class="font-semibold text-sm" [ngClass]="getProductStock(p) === 0 ? 'text-red-600 font-bold' : getProductStock(p) <= 5 ? 'text-amber-600 font-semibold' : 'text-green-600'">
                      {{ getProductStock(p) }}
                    </span>
                  </td>
                  <td>
                    <button
                      (click)="togglePublish(p.id)"
                      class="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                      [style.background]="p.isPublished ? '#D1FAE5' : '#F3F4F6'"
                      [style.color]="p.isPublished ? '#065F46' : '#6B7280'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            [style.background]="p.isPublished ? '#10B981' : '#9CA3AF'"></span>
                      {{ p.isPublished ? 'Published' : 'Draft' }}
                    </button>
                  </td>
                  <td class="col-actions">
                    <div class="flex items-center justify-end gap-2">
                      <a [routerLink]="['/admin/products', p.id, 'edit']"
                         class="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                         style="color: var(--color-primary); background: var(--color-primary-light);"
                         title="Edit Product">
                        <i class="pi pi-pencil text-xs"></i>
                      </a>
                      <button (click)="deleteProduct(p.id)"
                              class="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                              style="color: #991B1B; background: #FEE2E2;"
                              title="Delete Product">
                        <i class="pi pi-trash text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-xs" style="color: var(--color-text-muted);">
            Showing {{ filteredProducts().length }} of {{ products().length }} products
          </span>
        </div>
      }
    </div>
  `,
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private confirmService = inject(ConfirmService);

  products = signal<any[]>([]);
  categories = signal<any[]>([]);
  loading = signal<boolean>(true);
  searchTerm = signal<string>('');
  statusFilter = signal<string>('all');
  categoryFilter = signal<string>('all');
  selectedIds = signal<string[]>([]);
  sortField = signal<string>('');
  sortAsc = signal<boolean>(true);

  publishedCount = computed(() => this.products().filter(p => p.isPublished).length);
  draftCount = computed(() => this.products().filter(p => !p.isPublished).length);
  allSelected = computed(() => this.filteredProducts().length > 0 && this.filteredProducts().every(p => this.selectedIds().includes(p.id)));

  filteredProducts = computed(() => {
    let list = this.products();
    const q = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const cat = this.categoryFilter();

    if (q) list = list.filter(p => p.title?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
    if (status !== 'all') list = list.filter(p => status === 'published' ? p.isPublished : !p.isPublished);
    if (cat !== 'all') list = list.filter(p => (p.categoryId?.id || p.categoryId?._id || p.categoryId) === cat);

    const field = this.sortField();
    if (field) {
      list = [...list].sort((a, b) => {
        const av = field === 'stock' ? this.getProductStock(a) : (a[field] ?? 0);
        const bv = field === 'stock' ? this.getProductStock(b) : (b[field] ?? 0);
        return this.sortAsc() ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }
    return list;
  });

  getProductStock(product: any): number {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    }
    return product.stock ?? 0;
  }

  isSelected(id: string): boolean { return this.selectedIds().includes(id); }

  toggleSelect(id: string) {
    this.selectedIds.update(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  }

  toggleAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedIds.set(checked ? this.filteredProducts().map(p => p.id) : []);
  }

  sortBy(field: string) {
    if (this.sortField() === field) this.sortAsc.update(v => !v);
    else { this.sortField.set(field); this.sortAsc.set(true); }
  }

  ngOnInit() { this.fetchProducts(); this.fetchCategories(); }

  fetchProducts() {
    this.loading.set(true);
    this.productService.getAll({ limit: 100, includeDrafts: true }).subscribe({
      next: (res) => { this.products.set(res.data || []); this.loading.set(false); this.cdr.markForCheck(); },
      error: () => { this.loading.set(false); this.cdr.markForCheck(); },
    });
  }

  fetchCategories() {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => { this.categories.set(res.data || []); this.cdr.markForCheck(); },
      error: () => { }
    });
  }

  togglePublish(id: string) {
    this.http.patch<any>(`${environment.apiUrl}/products/${id}/publish`, {}).subscribe({
      next: (res) => {
        const n = res.data?.isPublished !== undefined ? res.data.isPublished : res.isPublished;
        this.products.update(list => list.map(p => p.id === id ? { ...p, isPublished: n } : p));
        this.cdr.markForCheck();
      },
    });
  }

  deleteProduct(id: string) {
    this.confirmService.confirm({ message: 'Delete this product? This cannot be undone.', type: 'danger', confirmLabel: 'Delete', cancelLabel: 'Cancel' })
      .subscribe(confirmed => {
        if (!confirmed) return;
        this.http.delete<any>(`${environment.apiUrl}/products/${id}`).subscribe({
          next: () => { this.products.update(list => list.filter(p => p.id !== id)); this.cdr.markForCheck(); },
        });
      });
  }

  bulkPublish(publish: boolean) {
    const ids = this.selectedIds();
    ids.forEach(id => {
      this.http.patch<any>(`${environment.apiUrl}/products/${id}/publish`, {}).subscribe({
        next: () => {
          this.products.update(list => list.map(p => ids.includes(p.id) ? { ...p, isPublished: publish } : p));
          this.cdr.markForCheck();
        }
      });
    });
    this.selectedIds.set([]);
  }

  bulkDelete() {
    const ids = this.selectedIds();
    this.confirmService.confirm({
      message: `Delete ${ids.length} products? This cannot be undone.`, type: 'danger', confirmLabel: 'Delete All', cancelLabel: 'Cancel'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      ids.forEach(id => {
        this.http.delete<any>(`${environment.apiUrl}/products/${id}`).subscribe({
          next: () => { this.products.update(list => list.filter(p => !ids.includes(p.id))); this.cdr.markForCheck(); }
        });
      });
      this.selectedIds.set([]);
    });
  }
}
