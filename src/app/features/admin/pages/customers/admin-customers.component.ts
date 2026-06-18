import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-customers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="card p-6 space-y-6 page-enter">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">Customers Registry</h2>
          <p class="text-neutral-500 text-xs mt-1">Review user accounts, check verification status, and toggle status</p>
        </div>
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-16 w-full rounded-2xl"></div>
          <div class="skeleton h-16 w-full rounded-2xl"></div>
        </div>
      } @else if (customers().length === 0) {
        <div class="text-center py-12 text-neutral-400">
          No registered customer accounts found.
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <th class="py-3 px-4">Name</th>
                <th class="py-3 px-4">Phone</th>
                <th class="py-3 px-4">Verification</th>
                <th class="py-3 px-4">Account status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-200">
              @for (c of customers(); track c._id) {
                <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                  <td class="py-3 px-4 font-bold text-neutral-800 dark:text-white">
                    {{ c.firstName }} {{ c.lastName }}
                  </td>
                  <td class="py-3 px-4 text-xs text-neutral-500">{{ c.phone }}</td>
                  <td class="py-3 px-4">
                    <span
                      [class.bg-emerald-50]="c.isVerified"
                      [class.text-emerald-700]="c.isVerified"
                      [class.bg-amber-50]="!c.isVerified"
                      [class.text-amber-700]="!c.isVerified"
                      class="px-2 py-0.5 rounded text-xs font-semibold capitalize"
                    >
                      {{ c.isVerified ? 'Verified' : 'Pending' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 font-semibold">
                    <span [class.text-green-600]="c.isActive" [class.text-red-500]="!c.isActive">
                      {{ c.isActive ? 'Active' : 'Suspended' }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <button
                      (click)="toggleStatus(c._id)"
                      [class.btn-secondary]="c.isActive"
                      [class.btn-primary]="!c.isActive"
                      class="px-3 py-1.5 text-xs font-bold rounded-xl"
                    >
                      {{ c.isActive ? 'Suspend' : 'Activate' }}
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
export class AdminCustomersComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  customers = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.fetchCustomers();
  }

  fetchCustomers() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/admin/customers`).subscribe({
      next: (res) => {
        this.customers.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  toggleStatus(id: string) {
    this.http.patch<any>(`${environment.apiUrl}/admin/customers/${id}/toggle-status`, {}).subscribe({
      next: () => {
        this.customers.update((list) =>
          list.map((c) => (c._id === id ? { ...c, isActive: !c.isActive } : c))
        );
        this.cdr.markForCheck();
      },
    });
  }
}
