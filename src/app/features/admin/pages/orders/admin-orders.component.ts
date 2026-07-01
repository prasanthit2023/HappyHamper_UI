import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-orders',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="card p-6 space-y-5 animate-fade-in">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-header-title">Orders</h2>
          <p class="page-header-sub">{{ orders().length }} total orders · Manage status and track deliveries</p>
        </div>
        <div class="page-header-actions">
          <button (click)="exportCSV()" class="btn-secondary text-xs py-2 px-3 gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <!-- Search + Date Filter Bar -->
      <div class="filter-bar">
        <div class="relative">
          <input
            type="text"
            placeholder="Search by order #, customer name, phone..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event); currentPage.set(1)"
            class="input-field py-2.5 pl-9 text-xs"
          />
          <svg class="w-4 h-4 absolute left-3 top-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <input
          type="date"
          [ngModel]="dateFrom()"
          (ngModelChange)="dateFrom.set($event); currentPage.set(1)"
          class="input-field py-2.5 text-xs"
          aria-label="Date from"
        />
        <input
          type="date"
          [ngModel]="dateTo()"
          (ngModelChange)="dateTo.set($event); currentPage.set(1)"
          class="input-field py-2.5 text-xs"
          aria-label="Date to"
        />
        @if (searchTerm() || dateFrom() || dateTo()) {
          <button (click)="clearFilters()" class="btn-ghost text-xs py-2 px-3 text-red-500">
            Clear
          </button>
        }
      </div>

      <!-- Status Tabs (scrollable on mobile) -->
      <div class="overflow-x-auto -mx-1 px-1 pb-1">
        <div class="flex gap-1 min-w-max border-b" style="border-color: var(--color-border);">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="selectTab(tab.id)"
              class="px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px whitespace-nowrap"
              [style.border-color]="activeTab() === tab.id ? 'var(--color-primary)' : 'transparent'"
              [style.color]="activeTab() === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'"
            >
              {{ tab.label }}
              <span
                class="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                [style.background]="activeTab() === tab.id ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'"
                [style.color]="activeTab() === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'"
              >{{ getTabCount(tab.id) }}</span>
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="skeleton h-16 w-full rounded-xl"></div>
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div class="empty-state-title">No orders yet</div>
          <div class="empty-state-sub">Orders will appear here once customers start purchasing.</div>
        </div>
      } @else if (filteredOrders().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div class="empty-state-title">No matching orders</div>
          <div class="empty-state-sub">Try adjusting your search or filter criteria.</div>
        </div>
      } @else {
        <div class="w-full overflow-x-auto rounded-xl border" style="border-color: var(--color-border);">
          <table class="admin-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sortBy('orderNumber')">
                  Order # <span class="ml-0.5">{{ sortField() === 'orderNumber' ? (sortAsc() ? '↑' : '↓') : '' }}</span>
                </th>
                <th>Customer</th>
                <th class="sortable" (click)="sortBy('totalAmount')">
                  Total <span class="ml-0.5">{{ sortField() === 'totalAmount' ? (sortAsc() ? '↑' : '↓') : '' }}</span>
                </th>
                <th>Payment</th>
                <th class="sortable" (click)="sortBy('createdAt')">
                  Date <span class="ml-0.5">{{ sortField() === 'createdAt' ? (sortAsc() ? '↑' : '↓') : '' }}</span>
                </th>
                <th>Status</th>
                <th class="col-actions">Update</th>
              </tr>
            </thead>
            <tbody>
              @for (order of paginatedOrders(); track order._id || order.id) {
                <tr>
                  <td>
                    <span class="font-mono font-bold text-xs" style="color: var(--color-text);">#{{ order.orderNumber }}</span>
                  </td>
                  <td>
                    <span class="font-semibold text-sm block" style="color: var(--color-text);">
                      {{ order.shippingAddress?.firstName }} {{ order.shippingAddress?.lastName }}
                    </span>
                    <span class="text-xs font-mono" style="color: var(--color-text-muted);">{{ order.shippingAddress?.phone }}</span>
                  </td>
                  <td class="font-bold" style="color: var(--color-text);"><i class="bi bi-currency-rupee"></i>{{ order.totalAmount | number:'1.0-0' }}</td>
                  <td>
                    <span class="status-badge"
                          [class]="order.paymentStatus === 'paid' ? 'status-delivered' : order.paymentStatus === 'failed' ? 'status-cancelled' : 'status-pending'">
                      {{ order.paymentStatus | titlecase }}
                    </span>
                  </td>
                  <td class="text-xs" style="color: var(--color-text-muted);">{{ order.createdAt | date:'dd MMM yy' }}</td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(order.orderStatus)">
                      {{ formatStatus(order.orderStatus) }}
                    </span>
                  </td>
                  <td class="col-actions">
                    <select
                      [ngModel]="order.orderStatus"
                      (ngModelChange)="updateStatus(order.id || order._id, $event)"
                      class="text-xs px-2 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-all"
                      style="border-color: var(--color-border); color: var(--color-text); background: white; min-width: 130px;"
                    >
                      <option value="placed">Placed</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination UI -->
        <div class="flex items-center justify-between pt-2">
          <span class="text-xs" style="color: var(--color-text-muted);">
            Showing {{ (currentPage() - 1) * pageSize() + 1 }} - {{ Math.min(currentPage() * pageSize(), filteredOrders().length) }} of {{ filteredOrders().length }} orders
          </span>
          <div class="flex items-center gap-1.5">
            <button
              [disabled]="currentPage() === 1"
              (click)="currentPage.set(currentPage() - 1)"
              class="btn-icon w-8 h-8 rounded-lg"
              [class.opacity-50]="currentPage() === 1"
              aria-label="Previous page"
            >
              <i class="pi pi-chevron-left text-xs"></i>
            </button>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-50 border" style="border-color: var(--color-border); color: var(--color-text);">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <button
              [disabled]="currentPage() === totalPages()"
              (click)="currentPage.set(currentPage() + 1)"
              class="btn-icon w-8 h-8 rounded-lg"
              [class.opacity-50]="currentPage() === totalPages()"
              aria-label="Next page"
            >
              <i class="pi pi-chevron-right text-xs"></i>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  orders      = signal<any[]>([]);
  loading     = signal<boolean>(true);
  searchTerm  = signal<string>('');
  activeTab   = signal<string>('all');
  dateFrom    = signal<string>('');
  dateTo      = signal<string>('');
  sortField   = signal<string>('createdAt');
  sortAsc     = signal<boolean>(false);
  currentPage = signal<number>(1);
  pageSize    = signal<number>(10);
  Math = Math;

  tabs = [
    { id: 'all',        label: 'All' },
    { id: 'pending',    label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'transit',    label: 'In Transit' },
    { id: 'delivered',  label: 'Delivered' },
    { id: 'cancelled',  label: 'Cancelled' },
  ];

  filteredOrders = computed(() => {
    let list  = this.orders();
    const tab = this.activeTab();
    const q   = this.searchTerm().toLowerCase().trim();
    const df  = this.dateFrom();
    const dt  = this.dateTo();

    if (tab !== 'all') {
      const tabMap: Record<string, string[]> = {
        pending:    ['placed', 'confirmed'],
        processing: ['processing'],
        transit:    ['shipped', 'out_for_delivery'],
        delivered:  ['delivered'],
        cancelled:  ['cancelled'],
      };
      list = list.filter(o => tabMap[tab]?.includes(o.orderStatus));
    }
    if (q) {
      list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.shippingAddress?.firstName?.toLowerCase().includes(q) ||
        o.shippingAddress?.lastName?.toLowerCase().includes(q) ||
        o.shippingAddress?.phone?.includes(q)
      );
    }
    if (df) list = list.filter(o => new Date(o.createdAt) >= new Date(df));
    if (dt) list = list.filter(o => new Date(o.createdAt) <= new Date(dt + 'T23:59:59'));

    const field = this.sortField();
    const asc   = this.sortAsc();
    list = [...list].sort((a, b) => {
      const av = field === 'createdAt' ? new Date(a[field]).getTime() : (a[field] ?? 0);
      const bv = field === 'createdAt' ? new Date(b[field]).getTime() : (b[field] ?? 0);
      return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return list;
  });

  paginatedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end   = start + this.pageSize();
    return this.filteredOrders().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredOrders().length / this.pageSize()) || 1;
  });

  ngOnInit() { this.fetchOrders(); }

  fetchOrders() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/orders/admin/all`).subscribe({
      next: (res) => { this.orders.set(res.data || []); this.loading.set(false); this.cdr.markForCheck(); },
      error: ()   => { this.loading.set(false); this.cdr.markForCheck(); },
    });
  }

  selectTab(id: string) {
    this.activeTab.set(id);
    this.currentPage.set(1);
  }

  clearFilters() {
    this.searchTerm.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
  }

  sortBy(field: string) {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(false);
    }
    this.currentPage.set(1);
  }

  getTabCount(tabId: string): number {
    const list = this.orders();
    const tabMap: Record<string, string[]> = {
      all: [], pending: ['placed','confirmed'], processing: ['processing'],
      transit: ['shipped','out_for_delivery'], delivered: ['delivered'], cancelled: ['cancelled'],
    };
    if (tabId === 'all') return list.length;
    return list.filter(o => tabMap[tabId]?.includes(o.orderStatus)).length;
  }

  formatStatus(s: string): string {
    return (s || 'placed').charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  }

  getStatusClass(s: string): string {
    return 'status-' + (s || 'placed').toLowerCase();
  }

  updateStatus(id: string, newStatus: string) {
    this.http.put<any>(`${environment.apiUrl}/orders/admin/${id}/status`, { status: newStatus, note: 'Updated by admin' }).subscribe({
      next: () => {
        this.orders.update(list => list.map(o => (o.id || o._id) === id ? { ...o, orderStatus: newStatus } : o));
        this.cdr.markForCheck();
      },
    });
  }

  exportCSV() {
    const rows = this.filteredOrders();
    const csv  = [
      ['Order #','Customer','Phone','Total','Payment','Status','Date'],
      ...rows.map(o => [
        o.orderNumber,
        `${o.shippingAddress?.firstName} ${o.shippingAddress?.lastName}`,
        o.shippingAddress?.phone || '',
        o.totalAmount,
        o.paymentStatus,
        o.orderStatus,
        o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''
      ])
    ].map(r => r.join(',')).join('\n');

    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }
}
