import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-returns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card p-6 space-y-5 animate-fade-in bg-white border border-beige">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-header-title text-neutral-800">Return Requests</h2>
          <p class="page-header-sub text-neutral-500">{{ returnsList().length }} return requests · Manage customer refunds and returns</p>
        </div>
        <div class="page-header-actions">
          @if (pendingCount() > 0) {
            <span class="status-badge status-confirmed flex items-center gap-1.5 animate-pulse bg-amber-50 text-amber-700 border border-amber-200">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {{ pendingCount() }} Awaiting Action
            </span>
          }
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="overflow-x-auto -mx-1 px-1 pb-1">
        <div class="flex gap-1 min-w-max border-b" style="border-color: var(--color-border);">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              class="px-4 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px whitespace-nowrap"
              [style.border-color]="activeTab() === tab.id ? 'var(--color-primary)' : 'transparent'"
              [style.color]="activeTab() === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'"
            >
              {{ tab.label }}
              <span class="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    [style.background]="activeTab() === tab.id ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)'"
                    [style.color]="activeTab() === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)'">
                {{ getTabCount(tab.id) }}
              </span>
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (_ of [1,2,3]; track $index) {
            <div class="skeleton h-20 w-full rounded-xl"></div>
          }
        </div>
      } @else if (returnsList().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon text-neutral-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
          <div class="empty-state-title text-neutral-700">No return requests</div>
          <div class="empty-state-sub text-neutral-500">Return requests will appear here when customers request them.</div>
        </div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon text-neutral-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
          </div>
          <div class="empty-state-title text-neutral-700">No {{ activeTab() }} requests</div>
          <div class="empty-state-sub text-neutral-500">There are no return requests with this status.</div>
        </div>
      } @else {
        <div class="w-full overflow-x-auto rounded-xl border border-beige">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Return Info</th>
                <th>Customer Details</th>
                <th>Reason Summary</th>
                <th>Refund Amount</th>
                <th>Status</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (ret of filtered(); track ret.id) {
                <!-- Main Row -->
                <tr [class.bg-amber-50]="ret.status === 'requested'" [class.bg-opacity-45]="ret.status === 'requested'" [class.bg-neutral-50]="ret.status !== 'requested'" [class.bg-opacity-20]="ret.status !== 'requested'" class="hover:bg-neutral-50 transition-colors border-b border-beige">
                  <td>
                    <div class="flex flex-col gap-0.5">
                      <span class="font-mono font-bold text-xs px-1.5 py-0.5 rounded inline-block w-fit"
                            style="background: var(--color-bg-subtle); color: var(--color-text-muted);">
                        RET-{{ ret.id?.slice(-6)?.toUpperCase() }}
                      </span>
                      <span class="text-xs font-semibold text-neutral-600">
                        Order #{{ ret.orderId?.orderNumber || 'N/A' }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-neutral-800">
                        {{ ret.user?.firstName }} {{ ret.user?.lastName }}
                      </span>
                      <span class="text-[10px] text-neutral-500">{{ ret.user?.phone }}</span>
                    </div>
                  </td>
                  <td>
                    <p class="text-xs italic text-neutral-600 truncate max-w-[200px]" [title]="ret.reason">
                      "{{ ret.reason }}"
                    </p>
                  </td>
                  <td class="font-bold text-xs text-neutral-800">₹{{ ret.refundAmount || 0 }}</td>
                  <td>
                    <span class="status-badge"
                          [class]="ret.status === 'approved' ? 'status-delivered' : ret.status === 'rejected' ? 'status-cancelled' : 'status-return_requested'">
                      {{ ret.status | titlecase }}
                    </span>
                  </td>
                  <td class="col-actions">
                    <button
                      (click)="toggleExpand(ret.id)"
                      class="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1 hover:bg-neutral-100"
                    >
                      <span>{{ expandedReturnId() === ret.id ? 'Hide Details' : 'View Details' }}</span>
                      <i class="pi" [class.pi-chevron-up]="expandedReturnId() === ret.id" [class.pi-chevron-down]="expandedReturnId() !== ret.id"></i>
                    </button>
                  </td>
                </tr>

                <!-- Expanded Detail Panel Row -->
                @if (expandedReturnId() === ret.id) {
                  <tr class="bg-neutral-50 bg-opacity-50">
                    <td colspan="6" class="p-6 border-b border-beige">
                      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-5 rounded-2xl border border-beige shadow-sm">
                        
                        <!-- Left Side: Return details and items -->
                        <div class="lg:col-span-8 space-y-4">
                          <div>
                            <h4 class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Items to Return</h4>
                            @if (ret.items && ret.items.length > 0) {
                              <div class="divide-y divide-beige max-h-60 overflow-y-auto pr-2">
                                @for (item of ret.items; track item.variantSku) {
                                  <div class="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                                    <img [src]="item.image || '/assets/placeholder-product.jpg'" 
                                         class="w-12 h-12 object-cover rounded-lg border border-beige bg-neutral-50 flex-shrink-0" />
                                    <div class="flex-1 min-w-0">
                                      <h5 class="text-xs font-bold text-neutral-800 truncate">{{ item.title }}</h5>
                                      <p class="text-[10px] text-neutral-500 font-mono">SKU: {{ item.variantSku }}</p>
                                    </div>
                                    <div class="text-right">
                                      <div class="text-xs font-bold text-neutral-800">Qty: {{ item.quantity }}</div>
                                    </div>
                                  </div>
                                }
                              </div>
                            } @else {
                              <p class="text-xs text-neutral-500 italic">No specific items listed.</p>
                            }
                          </div>

                          <div class="border-t border-beige pt-4">
                            <h4 class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Customer Explanation</h4>
                            <p class="text-xs text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-lg border border-beige">
                              {{ ret.description || 'No detailed description provided.' }}
                            </p>
                          </div>

                          <!-- Evidence Images -->
                          @if (ret.images && ret.images.length > 0) {
                            <div class="border-t border-beige pt-4">
                              <h4 class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Evidence Photos</h4>
                              <div class="flex flex-wrap gap-2">
                                @for (img of ret.images; track img) {
                                  <a [href]="img" target="_blank" class="group relative rounded-lg overflow-hidden border border-beige aspect-square w-16 bg-neutral-100 flex-shrink-0 block">
                                    <img [src]="img" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <i class="pi pi-external-link text-white text-xs"></i>
                                    </div>
                                  </a>
                                }
                              </div>
                            </div>
                          }
                        </div>

                        <!-- Right Side: Status timeline and Action block -->
                        <div class="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-beige pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between space-y-4">
                          <div>
                            <h4 class="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Request Overview</h4>
                            <div class="space-y-2 text-xs">
                              <div class="flex justify-between">
                                <span class="text-neutral-500">Date Requested:</span>
                                <span class="font-semibold text-neutral-800">{{ ret.createdAt | date:'mediumDate' }}</span>
                              </div>
                              <div class="flex justify-between">
                                <span class="text-neutral-500">Suggested Refund:</span>
                                <span class="font-bold text-neutral-800">₹{{ ret.refundAmount }}</span>
                              </div>
                              @if (ret.status !== 'requested') {
                                <div class="flex justify-between">
                                  <span class="text-neutral-500">Final Refund:</span>
                                  <span class="font-bold text-neutral-800">₹{{ ret.refundAmount }}</span>
                                </div>
                                <div class="flex justify-between">
                                  <span class="text-neutral-500">Status:</span>
                                  <span class="status-badge"
                                        [class]="ret.status === 'approved' ? 'status-delivered' : 'status-cancelled'">
                                    {{ ret.status | titlecase }}
                                  </span>
                                </div>
                              }
                            </div>
                          </div>

                          <!-- Action Form Panel -->
                          <div class="border-t border-beige pt-4 space-y-3">
                            @if (ret.status === 'requested') {
                              <div>
                                <label class="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Adjust Refund Amount (₹)</label>
                                <input type="number" 
                                       [(ngModel)]="ret.tempRefundAmount" 
                                       class="w-full px-3 py-1.5 text-xs border border-beige rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" 
                                       placeholder="Amount" />
                              </div>

                              <div>
                                <label class="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Admin Notes</label>
                                <textarea [(ngModel)]="ret.tempAdminNotes" 
                                          rows="2" 
                                          class="w-full px-3 py-1.5 text-xs border border-beige rounded-lg focus:outline-none focus:ring-1 focus:ring-primary resize-none" 
                                          placeholder="Explain approval or rejection decision..."></textarea>
                              </div>

                              <div class="grid grid-cols-2 gap-2 pt-2">
                                <button
                                  (click)="submitReturnDecision(ret.id, 'approved', ret.tempAdminNotes, ret.tempRefundAmount)"
                                  class="text-xs font-bold py-2 rounded-lg transition-all active:scale-95 text-center flex items-center justify-center gap-1 shadow-sm"
                                  style="background: #D1FAE5; color: #065F46;"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  (click)="submitReturnDecision(ret.id, 'rejected', ret.tempAdminNotes, ret.tempRefundAmount)"
                                  class="text-xs font-bold py-2 rounded-lg transition-all active:scale-95 text-center flex items-center justify-center gap-1 shadow-sm"
                                  style="background: #FEE2E2; color: #991B1B;"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            } @else {
                              <div class="bg-neutral-50 p-3 rounded-lg border border-beige text-xs space-y-1.5">
                                <span class="font-bold text-neutral-500 uppercase text-[9px] block">Admin Resolution Notes</span>
                                <p class="text-neutral-700 italic">"{{ ret.adminNotes || 'No notes left by admin.' }}"</p>
                                @if (ret.resolvedAt) {
                                  <span class="text-[10px] text-neutral-400 block pt-1 border-t border-beige/60">
                                    Resolved on {{ ret.resolvedAt | date:'medium' }}
                                  </span>
                                }
                              </div>
                            }
                          </div>

                        </div>

                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-xs text-neutral-500">
            Showing {{ filtered().length }} of {{ returnsList().length }} requests
          </span>
        </div>
      }
    </div>
  `,
})
export class AdminReturnsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr  = inject(ChangeDetectorRef);

  returnsList = signal<any[]>([]);
  loading     = signal<boolean>(true);
  activeTab   = signal<string>('all');
  expandedReturnId = signal<string | null>(null);

  tabs = [
    { id: 'all',       label: 'All' },
    { id: 'requested', label: 'Pending' },
    { id: 'approved',  label: 'Approved' },
    { id: 'rejected',  label: 'Rejected' },
  ];

  pendingCount = computed(() => this.returnsList().filter(r => r.status === 'requested').length);
  filtered     = computed(() => {
    const tab = this.activeTab();
    return tab === 'all' ? this.returnsList() : this.returnsList().filter(r => r.status === tab);
  });

  getTabCount(id: string): number {
    return id === 'all' ? this.returnsList().length : this.returnsList().filter(r => r.status === id).length;
  }

  ngOnInit() { this.fetchReturns(); }

  fetchReturns() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/returns`).subscribe({
      next: (res) => {
        const list = (res.data || []).map((r: any) => ({
          ...r,
          tempRefundAmount: r.refundAmount || 0,
          tempAdminNotes: ''
        }));
        this.returnsList.set(list);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: ()   => { this.loading.set(false); this.cdr.markForCheck(); },
    });
  }

  toggleExpand(id: string) {
    if (this.expandedReturnId() === id) {
      this.expandedReturnId.set(null);
    } else {
      this.expandedReturnId.set(id);
    }
  }

  submitReturnDecision(id: string, action: 'approved' | 'rejected', notes: string, refundAmount: number) {
    const finalNotes = notes.trim() || `Request was ${action} by administrator`;
    
    this.http.put<any>(`${environment.apiUrl}/returns/${id}/status`, {
      status: action,
      adminNotes: finalNotes,
      refundAmount: refundAmount || 0,
    }).subscribe({
      next: () => {
        this.returnsList.update(list => list.map(r => r.id === id ? { 
          ...r, 
          status: action, 
          adminNotes: finalNotes, 
          refundAmount: refundAmount,
          resolvedAt: new Date().toISOString()
        } : r));
        this.cdr.markForCheck();
      },
    });
  }
}
