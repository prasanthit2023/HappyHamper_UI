import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-inventory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card p-6 space-y-6 page-enter">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">Inventory Management</h2>
          <p class="text-neutral-500 text-xs mt-1">Monitor variant SKU stock levels and adjust warehouse amounts</p>
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-16 w-full rounded-2xl"></div>
          <div class="skeleton h-16 w-full rounded-2xl"></div>
        </div>
      } @else if (inventory().length === 0) {
        <div class="text-center py-12 text-neutral-400">
          No inventory records found.
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <th class="py-3 px-4">Variant SKU</th>
                <th class="py-3 px-4">Product</th>
                <th class="py-3 px-4">Current Stock</th>
                <th class="py-3 px-4">Alert Threshold</th>
                <th class="py-3 px-4 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-200">
              @for (item of inventory(); track item._id) {
                <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td class="py-3 px-4 font-mono font-bold text-xs">{{ item.variantSku }}</td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <img [src]="item.productId?.images?.[0] || '/assets/placeholder-product.jpg'" 
                           class="w-8 h-8 rounded-lg object-cover flex-shrink-0" alt="" />
                      <div>
                        <div class="font-semibold text-xs text-neutral-800 dark:text-white leading-tight">
                          {{ item.productId?.title || 'Unknown Product' }}
                        </div>
                        <div class="text-[10px] text-neutral-400 font-mono mt-0.5">
                          ID: {{ item.productId?._id || item.productId?.id || 'N/A' }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 font-semibold">
                    <span [class.text-red-500]="item.stock <= item.lowStockThreshold" [class.font-bold]="item.stock <= item.lowStockThreshold">
                      {{ item.stock }}
                    </span>
                    @if (item.stock <= item.lowStockThreshold) {
                      <span class="ml-2 text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded font-bold">LOW STOCK</span>
                    }
                  </td>
                  <td class="py-3 px-4">
                    <input
                      type="number"
                      [ngModel]="item.lowStockThreshold"
                      (ngModelChange)="updateThreshold(item.variantSku, $event)"
                      class="w-16 px-2 py-1 border rounded-lg text-xs bg-white dark:bg-neutral-850 focus:outline-none text-center"
                    />
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button (click)="adjustStock(item, 5, 'add')" class="px-2 py-1 bg-green-50 text-green-600 border border-green-200 rounded text-[10px] font-bold">+5</button>
                      <button (click)="adjustStock(item, 5, 'subtract')" class="px-2 py-1 bg-red-50 text-red-500 border border-red-200 rounded text-[10px] font-bold">-5</button>
                    </div>
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
export class AdminInventoryComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  inventory = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.fetchInventory();
  }

  fetchInventory() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/inventory`).subscribe({
      next: (res) => {
        this.inventory.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  updateThreshold(sku: string, newThreshold: number) {
    if (newThreshold < 0) return;
    this.http.patch<any>(`${environment.apiUrl}/inventory/${sku}/threshold`, { threshold: Number(newThreshold) }).subscribe({
      next: () => {
        this.inventory.update((list) =>
          list.map((item) => (item.variantSku === sku ? { ...item, lowStockThreshold: newThreshold } : item))
        );
        this.cdr.markForCheck();
      },
    });
  }

  adjustStock(item: any, quantity: number, action: 'add' | 'subtract') {
    const payload = {
      quantity,
      action,
      note: 'Manual adjustment via inventory panel',
    };

    this.http.post<any>(`${environment.apiUrl}/inventory/${item.variantSku}/adjust`, payload).subscribe({
      next: (res) => {
        this.inventory.update((list) =>
          list.map((i) => (i.variantSku === item.variantSku ? { ...i, stock: res.data?.stock || i.stock } : i))
        );
        this.cdr.markForCheck();
      },
    });
  }
}
