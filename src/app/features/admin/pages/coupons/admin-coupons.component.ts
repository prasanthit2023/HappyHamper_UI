import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'bb-admin-coupons',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Create Coupon (Top) -->
      <div class="card p-5 space-y-4">
        <h2 class="page-header-title border-b pb-3" style="border-color: var(--color-border);">Create Coupon</h2>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Coupon Code</label>
              <input type="text" formControlName="code" class="input-field py-2 uppercase font-mono" placeholder="e.g. BLISS20" />
              @if (form.get('code')?.invalid && form.get('code')?.touched) {
                <p class="text-red-500 text-[10px] mt-1">Code is required.</p>
              }
            </div>

            <div>
              <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Discount Type</label>
              <select formControlName="discountType" class="input-field py-2 text-xs">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (<i class="bi bi-currency-rupee"></i>)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Value</label>
              <input type="number" formControlName="discountValue" class="input-field py-2" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Min Order (<i class="bi bi-currency-rupee"></i>)</label>
              <input type="number" formControlName="minOrderAmount" class="input-field py-2" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Usage Limit</label>
              <input type="number" formControlName="usageLimit" class="input-field py-2" placeholder="Unlimited" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Expiry Date</label>
              <input type="date" formControlName="expiryDate" class="input-field py-2" />
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button type="submit" [disabled]="form.invalid || actionLoading()" class="btn-primary px-6 py-2.5 text-xs font-bold w-full md:w-auto">
              Create Coupon
            </button>
          </div>
        </form>
      </div>

      <!-- Coupons Directory (Bottom) -->
      <div class="card p-5 space-y-4">
        <h2 class="page-header-title border-b pb-3" style="border-color: var(--color-border);">Coupons ({{ coupons().length }})</h2>

        @if (loading()) {
          <div class="space-y-3">
            <div class="skeleton h-12 w-full rounded-xl"></div>
            <div class="skeleton h-12 w-full rounded-xl"></div>
          </div>
        } @else if (coupons().length === 0) {
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
            </div>
            <div class="empty-state-title">No coupons yet</div>
            <div class="empty-state-sub">Create your first discount coupon using the form on the left.</div>
          </div>
        } @else {
          <div class="w-full overflow-x-auto rounded-xl border" style="border-color: var(--color-border);">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage (Used/Max)</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th class="col-actions">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (cop of coupons(); track cop._id || cop.id) {
                  <tr>
                    <td>
                      <span class="font-mono font-bold text-xs px-2.5 py-1.5 rounded-lg"
                            style="background: var(--color-primary-light); color: var(--color-primary-dark);">
                        {{ cop.code }}
                      </span>
                    </td>
                    <td class="font-semibold text-sm" style="color: var(--color-text);">
                      {{ cop.discountValue }}@if (cop.discountType === 'percentage') { % } @else { <i class="bi bi-currency-rupee"></i> }
                      <span class="text-xs font-normal ml-1" style="color: var(--color-text-muted);">
                        {{ cop.discountType === 'percentage' ? 'off' : 'flat' }}
                      </span>
                    </td>
                    <td class="text-xs" style="color: var(--color-text-muted);"><i class="bi bi-currency-rupee"></i>{{ cop.minOrderAmount || 0 }}</td>
                    <td>
                      <div class="flex flex-col gap-1 w-28">
                        <div class="flex justify-between text-[10px] text-neutral-500 font-semibold">
                          <span>{{ cop.usageCount || 0 }} / {{ cop.usageLimit || '∞' }}</span>
                          @if (cop.usageLimit) {
                            <span>{{ Math.round(((cop.usageCount || 0) / cop.usageLimit) * 100) }}%</span>
                          }
                        </div>
                        @if (cop.usageLimit) {
                          <div class="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                            <div class="h-full bg-green-500 transition-all duration-300"
                                 [style.width.%]="Math.min(100, ((cop.usageCount || 0) / cop.usageLimit) * 100)"></div>
                          </div>
                        }
                      </div>
                    </td>
                    <td class="text-xs font-medium" style="color: var(--color-text-muted);">
                      {{ getExpiryCountdown(cop.expiryDate || cop.endDate) }}
                    </td>
                    <td>
                      <span class="status-badge" [class]="getExpiryClass(cop.expiryDate || cop.endDate)">
                        {{ getExpiryLabel(cop.expiryDate || cop.endDate) }}
                      </span>
                    </td>
                    <td class="col-actions">
                      <div class="flex items-center justify-end">
                        <button (click)="deleteCoupon(cop._id || cop.id)"
                                class="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                                style="color: #991B1B; background: #FEE2E2;"
                                title="Delete Coupon">
                          <i class="pi pi-trash text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminCouponsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private confirmService = inject(ConfirmService);

  coupons = signal<any[]>([]);
  loading = signal<boolean>(true);
  actionLoading = signal<boolean>(false);
  Math = Math;

  form = this.fb.group({
    code: ['', [Validators.required]],
    discountType: ['percentage', [Validators.required]],
    discountValue: [10, [Validators.required, Validators.min(1)]],
    minOrderAmount: [0, [Validators.required, Validators.min(0)]],
    usageLimit: [null as number | null],
    expiryDate: ['', [Validators.required]],
  });

  ngOnInit() {
    this.fetchCoupons();
  }

  fetchCoupons() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/coupons`).subscribe({
      next: (res) => {
        this.coupons.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  deleteCoupon(id: string) {
    this.confirmService.confirm({
      message: 'Are you sure you want to delete this coupon?',
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.http.delete<any>(`${environment.apiUrl}/coupons/${id}`).subscribe({
          next: () => {
            this.coupons.update((list) => list.filter((c) => (c._id || c.id) !== id));
            this.cdr.markForCheck();
          },
        });
      }
    });
  }

  getExpiryClass(date: string): string {
    if (!date) return 'status-cancelled';
    const diff = new Date(date).getTime() - Date.now();
    if (diff < 0) return 'status-cancelled';
    if (diff < 7 * 24 * 60 * 60 * 1000) return 'status-confirmed';
    return 'status-active';
  }

  getExpiryLabel(date: string): string {
    if (!date) return 'Expired';
    const diff = new Date(date).getTime() - Date.now();
    if (diff < 0) return 'Expired';
    if (diff < 7 * 24 * 60 * 60 * 1000) return 'Expiring Soon';
    return 'Active';
  }

  getExpiryCountdown(dateStr: string): string {
    if (!dateStr) return 'No date';
    const expiry = new Date(dateStr);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs < 0) return 'Expired';
    
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Expires tomorrow';
    if (diffDays <= 7) return `${diffDays} days left`;
    return expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.actionLoading.set(true);

    const payload = {
      code: this.form.value.code!.trim().toUpperCase(),
      discountType: this.form.value.discountType!,
      discountValue: Number(this.form.value.discountValue!),
      minOrderAmount: Number(this.form.value.minOrderAmount!),
      usageLimit: this.form.value.usageLimit ? Number(this.form.value.usageLimit) : null,
      expiryDate: new Date(this.form.value.expiryDate!),
      endDate: new Date(this.form.value.expiryDate!), // Support backend mapping
      startDate: new Date(), // Support backend non-null mapping
    };

    this.http.post<any>(`${environment.apiUrl}/coupons`, payload).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.form.reset({
          code: '',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 0,
          usageLimit: null,
          expiryDate: '',
        });
        this.fetchCoupons();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
