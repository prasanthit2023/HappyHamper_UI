import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-coupons',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 page-enter">
      <!-- Create Coupon (Left Column) -->
      <div class="card p-5 h-fit space-y-4">
        <h2 class="font-bold text-base text-neutral-900 dark:text-white uppercase tracking-wider border-b pb-2">
          Create Coupon
        </h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Coupon Code</label>
            <input type="text" formControlName="code" class="input-field py-2 uppercase font-mono" placeholder="e.g. BLISS20" />
            @if (form.get('code')?.invalid && form.get('code')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">Code is required.</p>
            }
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Discount Type</label>
              <select formControlName="discountType" class="input-field py-2 text-xs">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Value</label>
              <input type="number" formControlName="discountValue" class="input-field py-2" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Min Order Amount (₹)</label>
            <input type="number" formControlName="minOrderAmount" class="input-field py-2" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Expiry Date</label>
            <input type="date" formControlName="expiryDate" class="input-field py-2" />
          </div>

          <button type="submit" [disabled]="form.invalid || actionLoading()" class="btn-primary w-full py-2.5 text-xs font-bold shadow-pink">
            Create Coupon
          </button>
        </form>
      </div>

      <!-- Coupons Directory (Right Column) -->
      <div class="lg:col-span-2 card p-5 space-y-4">
        <h2 class="font-bold text-base text-neutral-900 dark:text-white uppercase tracking-wider border-b pb-2">
          Coupons Directory
        </h2>

        @if (loading()) {
          <div class="space-y-3">
            <div class="skeleton h-12 w-full rounded-xl"></div>
            <div class="skeleton h-12 w-full rounded-xl"></div>
          </div>
        } @else if (coupons().length === 0) {
          <div class="text-center py-8 text-neutral-400">
            No discount coupons defined yet.
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                  <th class="py-2 px-3">Code</th>
                  <th class="py-2 px-3">Discount</th>
                  <th class="py-2 px-3">Min Order</th>
                  <th class="py-2 px-3">Expires</th>
                  <th class="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-200">
                @for (cop of coupons(); track cop._id) {
                  <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td class="py-3 px-3 font-mono font-bold text-neutral-800 dark:text-white">{{ cop.code }}</td>
                    <td class="py-3 px-3">
                      {{ cop.discountValue }}{{ cop.discountType === 'percentage' ? '%' : '₹' }}
                    </td>
                    <td class="py-3 px-3">₹{{ cop.minOrderAmount || 0 }}</td>
                    <td class="py-3 px-3 text-xs text-neutral-500">{{ cop.expiryDate | date:'shortDate' }}</td>
                    <td class="py-3 px-3 text-right">
                      <button (click)="deleteCoupon(cop._id)" class="text-xs text-red-500 font-bold hover:underline">
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
    </div>
  `,
})
export class AdminCouponsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  coupons = signal<any[]>([]);
  loading = signal<boolean>(true);
  actionLoading = signal<boolean>(false);

  form = this.fb.group({
    code: ['', [Validators.required]],
    discountType: ['percentage', [Validators.required]],
    discountValue: [10, [Validators.required, Validators.min(1)]],
    minOrderAmount: [0, [Validators.required, Validators.min(0)]],
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
    if (confirm('Are you sure you want to delete this coupon?')) {
      this.http.delete<any>(`${environment.apiUrl}/coupons/${id}`).subscribe({
        next: () => {
          this.coupons.update((list) => list.filter((c) => c._id !== id));
          this.cdr.markForCheck();
        },
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.actionLoading.set(true);

    const payload = {
      code: this.form.value.code!.trim().toUpperCase(),
      discountType: this.form.value.discountType!,
      discountValue: Number(this.form.value.discountValue!),
      minOrderAmount: Number(this.form.value.minOrderAmount!),
      expiryDate: new Date(this.form.value.expiryDate!),
    };

    this.http.post<any>(`${environment.apiUrl}/coupons`, payload).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.form.reset({
          code: '',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 0,
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
