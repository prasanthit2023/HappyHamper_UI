import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'bb-admin-inventory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card p-6 space-y-5 animate-fade-in">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-header-title">Inventory</h2>
          <p class="page-header-sub">{{ totalItemsCount() }} SKUs tracked · Adjust stock levels and alert thresholds</p>
        </div>
        <div class="page-header-actions flex-wrap gap-2">
          @if (outOfStockCount() > 0) {
            <span class="status-badge status-cancelled flex items-center gap-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              {{ outOfStockCount() }} Out of Stock
            </span>
          }
          @if (lowStockCount() > 0) {
            <span class="status-badge status-confirmed flex items-center gap-1 animate-pulse">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {{ lowStockCount() }} Low Stock
            </span>
          }
        </div>
      </div>

      <!-- Critical Stock Alerts Bar -->
      @if (outOfStockCount() > 0 || lowStockCount() > 0) {
        <div class="p-4 rounded-xl border flex items-center gap-3.5 animate-fade-in"
             style="background: #FFFBEB; border-color: #FDE68A; color: #92400E;">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background: #FEF3C7;">
            <i class="pi pi-exclamation-triangle text-amber-600 text-lg"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm text-amber-800">Critical Stock Alerts</h4>
            <p class="text-xs text-amber-700 mt-0.5">
              You have <span class="font-bold text-red-600">{{ outOfStockCount() }} items completely out of stock</span> and
              <span class="font-bold">{{ lowStockCount() }} items running low on stock</span>. Action is required.
            </p>
          </div>
        </div>
      }

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="relative">
          <input type="text"
                 placeholder="Search by SKU or product name..."
                 [ngModel]="searchTerm()"
                 (ngModelChange)="searchTerm.set($event)"
                 class="input-field py-2.5 pl-9 text-xs" />
          <svg class="w-4 h-4 absolute left-3 top-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <select [ngModel]="stockFilter()" (ngModelChange)="stockFilter.set($event)"
                class="input-field py-2.5 text-xs cursor-pointer">
          <option value="all">All Stock Levels</option>
          <option value="low">Low / Out of Stock</option>
          <option value="ok">In Stock</option>
        </select>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="skeleton h-16 w-full rounded-xl"></div>
          }
        </div>
      } @else if (inventory().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <div class="empty-state-title">No inventory records</div>
          <div class="empty-state-sub">Inventory records will appear once products with variants are added.</div>
        </div>
      } @else {
        <div class="w-full overflow-x-auto rounded-xl border" style="border-color: var(--color-border);">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock Level</th>
                <th>Alert At</th>
                <th class="col-actions">Quick Adjust</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filtered(); track item.variantSku) {
                <tr [class.bg-red-50]="item.stock === 0" [class.bg-amber-50]="item.stock > 0 && item.stock <= item.lowStockThreshold">
                  <td>
                    <div class="flex items-center gap-3">
                      <img [src]="item.product?.images?.[0] || '/assets/placeholder-product.jpg'"
                           class="w-10 h-10 rounded-lg object-cover flex-shrink-0 border"
                           style="border-color: var(--color-border);" alt="" />
                      <span class="font-medium text-sm" style="color: var(--color-text);">
                        {{ item.product?.title || 'Unknown Product' }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="font-mono text-xs px-2 py-1 rounded-md"
                          style="background: var(--color-bg-subtle); color: var(--color-text-muted);">
                      {{ item.variantSku }}
                    </span>
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                      <span class="font-bold text-sm w-8 text-right flex-shrink-0"
                            [style.color]="item.stock === 0 ? '#991B1B' : item.stock <= item.lowStockThreshold ? '#B45309' : 'var(--color-text)'">
                        {{ item.stock }}
                      </span>
                      <div class="stock-level-bar">
                        <div class="stock-level-fill"
                             [class]="item.stock === 0 ? 'low' : item.stock <= item.lowStockThreshold ? 'medium' : 'high'"
                             [style.width.%]="getStockPercent(item)">
                        </div>
                      </div>
                      <span class="status-badge text-[10px]"
                            [class]="item.stock === 0 ? 'status-out-of-stock' : item.stock <= item.lowStockThreshold ? 'status-low-stock' : 'status-in-stock'">
                        {{ item.stock === 0 ? 'Out' : item.stock <= item.lowStockThreshold ? 'Low' : 'OK' }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      [ngModel]="item.lowStockThreshold"
                      (ngModelChange)="updateThreshold(item.variantSku, $event)"
                      min="0"
                      class="w-16 text-center input-field py-1.5 text-xs"
                    />
                  </td>
                  <td class="col-actions">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="adjustStock(item, 1, 'subtract')"
                              class="w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center transition-all active:scale-90 hover:scale-105 shadow-sm"
                              style="background: #FEE2E2; color: #991B1B;"
                              aria-label="Decrease stock by 1">
                        −
                      </button>
                      <button (click)="adjustStock(item, 1, 'add')"
                              class="w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center transition-all active:scale-90 hover:scale-105 shadow-sm"
                              style="background: #D1FAE5; color: #065F46;"
                              aria-label="Increase stock by 1">
                        +
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
            Showing {{ filtered().length }} of {{ inventory().length }} SKUs
          </span>
        </div>
      }
    </div>
  `,
})
export class AdminInventoryComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  inventory    = signal<any[]>([]);
  loading      = signal<boolean>(true);
  searchTerm   = signal<string>('');
  stockFilter  = signal<string>('all');

  lowStockCount   = computed(() => this.inventory().filter(i => i.stock > 0 && i.stock <= i.lowStockThreshold).length);
  outOfStockCount = computed(() => this.inventory().filter(i => i.stock === 0).length);
  totalItemsCount = computed(() => this.inventory().length);

  filtered = computed(() => {
    let list = this.inventory();
    const q  = this.searchTerm().toLowerCase().trim();
    const sf = this.stockFilter();
    if (q)  list = list.filter(i => i.variantSku?.toLowerCase().includes(q) || i.product?.title?.toLowerCase().includes(q));
    if (sf === 'low') list = list.filter(i => i.stock <= i.lowStockThreshold);
    if (sf === 'ok')  list = list.filter(i => i.stock > i.lowStockThreshold);
    return list;
  });

  getStockPercent(item: any): number {
    const max = Math.max(item.lowStockThreshold * 4, 20);
    return Math.min(100, Math.round((item.stock / max) * 100));
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['stock']) {
        this.stockFilter.set(params['stock']);
      }
    });
    this.fetchInventory();
  }

  fetchInventory() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/inventory`).subscribe({
      next: (res) => { this.inventory.set(res.data || []); this.loading.set(false); this.cdr.markForCheck(); },
      error: ()   => { this.loading.set(false); this.cdr.markForCheck(); },
    });
  }

  updateThreshold(sku: string, newThreshold: number) {
    if (newThreshold < 0) return;
    this.http.patch<any>(`${environment.apiUrl}/inventory/${sku}/threshold`, { threshold: Number(newThreshold) }).subscribe({
      next: () => {
        this.inventory.update(list => list.map(i => i.variantSku === sku ? { ...i, lowStockThreshold: newThreshold } : i));
        this.cdr.markForCheck();
      },
    });
  }

  adjustStock(item: any, quantity: number, action: 'add' | 'subtract') {
    const qty = Math.max(1, Number(quantity));
    this.http.post<any>(`${environment.apiUrl}/inventory/${item.variantSku}/adjust`, { quantity: qty, action, note: 'Manual admin adjustment' }).subscribe({
      next: (res) => {
        this.inventory.update(list => list.map(i => i.variantSku === item.variantSku ? { ...i, stock: res.data?.stock ?? i.stock } : i));
        this.cdr.markForCheck();
      },
    });
  }
}
