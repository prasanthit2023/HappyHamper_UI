import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-returns',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card p-6 space-y-6 page-enter">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">Returns Management</h2>
          <p class="text-neutral-500 text-xs mt-1">Review return requests, process refunds, and accept returns</p>
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-16 w-full rounded-2xl"></div>
          <div class="skeleton h-16 w-full rounded-2xl"></div>
        </div>
      } @else if (returnsList().length === 0) {
        <div class="text-center py-12 text-neutral-400">
          No return requests found.
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <th class="py-3 px-4">Request info</th>
                <th class="py-3 px-4">Reason</th>
                <th class="py-3 px-4">Refund Estimation</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Process Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-200">
              @for (ret of returnsList(); track ret._id) {
                <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td class="py-3 px-4">
                    <span class="text-xs text-neutral-400 block font-semibold font-mono">RET-ID: #{{ ret._id | slice:20:24 }}</span>
                    <span class="text-xs text-neutral-500 block font-medium">Order Number: #{{ ret.orderId?.orderNumber || 'Unknown' }}</span>
                  </td>
                  <td class="py-3 px-4 text-xs italic">
                    "{{ ret.reason }}"
                  </td>
                  <td class="py-3 px-4 font-semibold text-neutral-900 dark:text-white">
                    ₹{{ ret.refundAmount || 0 }}
                  </td>
                  <td class="py-3 px-4">
                    <span
                      [class.bg-amber-50]="ret.status === 'requested'"
                      [class.text-amber-700]="ret.status === 'requested'"
                      [class.bg-green-50]="ret.status === 'approved'"
                      [class.text-green-700]="ret.status === 'approved'"
                      [class.bg-red-50]="ret.status === 'rejected'"
                      [class.text-red-700]="ret.status === 'rejected'"
                      class="px-2.5 py-1 rounded-full text-xs font-bold capitalize"
                    >
                      {{ ret.status }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right space-x-2">
                    @if (ret.status === 'requested') {
                      <button
                        (click)="processReturn(ret._id, 'approved')"
                        class="px-2.5 py-1 bg-green-50 text-green-600 border border-green-200 rounded text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        (click)="processReturn(ret._id, 'rejected')"
                        class="px-2.5 py-1 bg-red-50 text-red-500 border border-red-200 rounded text-xs font-semibold"
                      >
                        Reject
                      </button>
                    } @else {
                      <span class="text-xs text-neutral-400">Processed</span>
                    }
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
export class AdminReturnsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  returnsList = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.fetchReturns();
  }

  fetchReturns() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/returns`).subscribe({
      next: (res) => {
        this.returnsList.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  processReturn(id: string, action: 'approved' | 'rejected') {
    const payload = {
      status: action,
      adminNotes: `Request was ${action} by administrator`,
      refundAmount: 250, // Simulated default refund value or custom logic
    };

    this.http.put<any>(`${environment.apiUrl}/returns/${id}/status`, payload).subscribe({
      next: () => {
        this.returnsList.update((list) =>
          list.map((r) => (r._id === id ? { ...r, status: action, refundAmount: payload.refundAmount } : r))
        );
        this.cdr.markForCheck();
      },
    });
  }
}
