import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'bb-admin-customers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card p-6 space-y-5 animate-fade-in">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-header-title flex items-center gap-2">
            Customers
            <span class="text-xs px-2.5 py-1 rounded-full font-bold" style="background: var(--color-primary-light); color: var(--color-primary-dark);">
              {{ customers().length }}
            </span>
          </h2>
          <p class="page-header-sub">Manage customer accounts, verify credentials, and review user history</p>
        </div>
        <div class="page-header-actions">
          <button (click)="exportCSV()" class="btn-secondary text-xs py-2 px-3 gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <!-- Search -->
        <div class="relative">
          <input
            type="text"
            placeholder="Search by name or phone..."
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            class="input-field py-2.5 pl-9 text-xs"
          />
          <svg class="w-4 h-4 absolute left-3 top-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>

        <!-- Verification Filter -->
        <select [ngModel]="verifiedFilter()" (ngModelChange)="verifiedFilter.set($event)"
                class="input-field py-2.5 text-xs cursor-pointer" aria-label="Filter by verification">
          <option value="all">All Verification</option>
          <option value="verified">Verified Only</option>
          <option value="pending">Pending Only</option>
        </select>

        <!-- Status Filter -->
        <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)"
                class="input-field py-2.5 text-xs cursor-pointer" aria-label="Filter by status">
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="suspended">Suspended Only</option>
        </select>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="skeleton h-14 w-full rounded-xl"></div>
          }
        </div>
      } @else if (customers().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <div class="empty-state-title">No customers yet</div>
          <div class="empty-state-sub">Customers will appear here once they register an account.</div>
        </div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div class="empty-state-title">No results</div>
          <div class="empty-state-sub">No customers match your search or filter criteria.</div>
        </div>
      } @else {
        <div class="w-full overflow-x-auto rounded-xl border" style="border-color: var(--color-border);">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Last Order</th>
                <th>Total Spent</th>
                <th>Verification</th>
                <th>Status</th>
                @if (authStore.isSuperAdmin()) {
                  <th class="col-actions">Actions</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (c of filtered(); track c.id) {
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                           style="background: var(--gradient-primary);">
                        {{ (c.firstName || '?').charAt(0).toUpperCase() }}
                      </div>
                      <div>
                        <div class="font-semibold text-sm" style="color: var(--color-text);">
                          {{ c.firstName }} {{ c.lastName }}
                        </div>
                        <div class="text-xs" style="color: var(--color-text-muted);">#{{ c.id?.slice(-6) }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-xs font-mono" style="color: var(--color-text-muted);">{{ c.phone || '—' }}</td>
                  <td class="text-xs" style="color: var(--color-text-muted);">
                    {{ c.createdAt ? (c.createdAt | date:'dd MMM yyyy') : '—' }}
                  </td>
                  <td class="text-xs" style="color: var(--color-text-muted);">
                    {{ c.lastOrderDate ? (c.lastOrderDate | date:'dd MMM yyyy') : '—' }}
                  </td>
                  <td class="font-semibold text-sm" style="color: var(--color-text);">
                    <i class="bi bi-currency-rupee"></i>{{ (c.totalSpent || 0) | number:'1.0-0' }}
                  </td>
                  <td>
                    <span class="status-badge" [class]="c.isVerified ? 'status-verified' : 'status-pending'">
                      {{ c.isVerified ? 'Verified' : 'Pending' }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="c.isActive ? 'status-active' : 'status-suspended'">
                      {{ c.isActive ? 'Active' : 'Suspended' }}
                    </span>
                  </td>
                  @if (authStore.isSuperAdmin()) {
                    <td class="col-actions">
                      <button
                        (click)="toggleStatus(c.id)"
                        class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        [style.background]="c.isActive ? '#FEE2E2' : '#D1FAE5'"
                        [style.color]="c.isActive ? '#991B1B' : '#065F46'"
                      >
                        {{ c.isActive ? 'Suspend' : 'Activate' }}
                      </button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Footer count -->
        <div class="flex items-center justify-between pt-1">
          <span class="text-xs" style="color: var(--color-text-muted);">
            Showing {{ filtered().length }} of {{ customers().length }} customers
          </span>
        </div>
      }
    </div>
  `,
})
export class AdminCustomersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);
  readonly authStore = inject(AuthStore);

  customers     = signal<any[]>([]);
  loading       = signal<boolean>(true);
  searchTerm    = signal<string>('');
  verifiedFilter = signal<string>('all');
  statusFilter  = signal<string>('all');

  filtered = computed(() => {
    let list = this.customers();
    const q  = this.searchTerm().toLowerCase().trim();
    const v  = this.verifiedFilter();
    const s  = this.statusFilter();

    if (q) {
      list = list.filter(c =>
        (c.firstName + ' ' + c.lastName).toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    if (v !== 'all') list = list.filter(c => v === 'verified' ? c.isVerified : !c.isVerified);
    if (s !== 'all') list = list.filter(c => s === 'active'   ? c.isActive   : !c.isActive);
    return list;
  });

  ngOnInit() { this.fetchCustomers(); }

  fetchCustomers() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/admin/customers`).subscribe({
      next: (res) => { this.customers.set(res.data || []); this.loading.set(false); this.cdr.markForCheck(); },
      error: ()    => { this.loading.set(false); this.cdr.markForCheck(); },
    });
  }

  toggleStatus(id: string) {
    this.http.patch<any>(`${environment.apiUrl}/admin/customers/${id}/toggle-status`, {}).subscribe({
      next: () => {
        this.customers.update(list => list.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
        this.cdr.markForCheck();
      },
    });
  }

  exportCSV() {
    const rows = this.filtered();
    const csv  = [
      ['Name','Phone','Verified','Status','Joined'],
      ...rows.map(c => [
        `${c.firstName} ${c.lastName}`, c.phone || '',
        c.isVerified ? 'Yes' : 'No', c.isActive ? 'Active' : 'Suspended',
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
      ])
    ].map(r => r.join(',')).join('\n');

    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `customers-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }
}
