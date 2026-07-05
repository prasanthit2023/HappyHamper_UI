import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'bb-admin-sizes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 page-enter">
      <!-- Create Size Card (Top) -->
      <div class="card p-5 border border-beige bg-white shadow-sm">
        <h2 class="font-bold text-sm text-neutral-800 uppercase tracking-wider border-b border-beige pb-3 mb-4">Create Size</h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col sm:flex-row items-end gap-4 max-w-xl">
          <div class="flex-1 w-full">
            <label class="block text-xs font-bold text-neutral-500 mb-1.5">Size Name</label>
            <input type="text" formControlName="sizeName" class="input-field py-2" placeholder="e.g. 3-6 Months" />
            @if (form.get('sizeName')?.invalid && form.get('sizeName')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">Size name is required.</p>
            }
            @if (errorMessage()) {
              <p class="text-red-500 text-[10px] mt-1">{{ errorMessage() }}</p>
            }
          </div>
          <button type="submit" [disabled]="form.invalid || actionLoading()" class="btn-primary py-2.5 px-6 text-xs font-bold shadow-pink flex items-center justify-center gap-2 h-10 w-full sm:w-auto">
            @if (actionLoading()) {
              <i class="pi pi-spinner animate-spin"></i>
            }
            Create Size
          </button>
        </form>
      </div>

      <!-- Sizes Directory List (Bottom) -->
      <div class="card p-5 border border-beige bg-white shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-beige pb-3">
          <h2 class="font-bold text-sm text-neutral-800 uppercase tracking-wider">Sizes Master ({{ sizes().length }})</h2>
        </div>

        @if (loading()) {
          <div class="space-y-2">
            <div class="skeleton h-10 w-full rounded-xl"></div>
            <div class="skeleton h-10 w-full rounded-xl"></div>
          </div>
        } @else if (sizes().length === 0) {
          <div class="empty-state py-8">
            <div class="empty-state-title">No sizes found</div>
            <div class="empty-state-sub">Create your first size master record using the form above.</div>
          </div>
        } @else {
          <div class="overflow-x-auto rounded-xl border border-neutral-100">
            <table class="w-full border-collapse text-left admin-table">
              <thead>
                <tr class="bg-neutral-50/60 border-b border-neutral-100">
                  <th class="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Size ID</th>
                  <th class="py-2.5 px-4 text-[10px] font-bold uppercase tracking-wider text-neutral-400">Size Name</th>
                  <th class="py-2.5 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 w-20">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100/60">
                @for (size of sizes(); track size.sizeId) {
                  <tr class="hover:bg-neutral-50/20 transition-colors">
                    <td class="py-3.5 px-4 text-xs font-semibold text-neutral-500 font-mono">#{{ size.sizeId }}</td>
                    <td class="py-3.5 px-4 text-xs font-bold text-neutral-800">{{ size.sizeName }}</td>
                    <td class="py-3.5 px-4 text-center">
                      <button (click)="deleteSize(size.sizeId)" class="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-xs hover:bg-red-100 transition-all mx-auto" title="Delete Size">
                        <i class="pi pi-trash"></i>
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
  `
})
export class AdminSizesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private confirmService = inject(ConfirmService);

  sizes = signal<any[]>([]);
  loading = signal<boolean>(true);
  actionLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  form = this.fb.group({
    sizeName: ['', [Validators.required]]
  });

  ngOnInit() {
    this.fetchSizes();
  }

  fetchSizes() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/sizes`).subscribe({
      next: (res) => {
        this.sizes.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  deleteSize(id: number) {
    this.confirmService.confirm({
      message: 'Are you sure you want to delete this size?',
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.http.delete<any>(`${environment.apiUrl}/sizes/${id}`).subscribe({
          next: () => {
            this.sizes.update(list => list.filter(s => s.sizeId !== id));
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.actionLoading.set(true);
    this.errorMessage.set('');

    const payload = {
      sizeName: this.form.value.sizeName!.trim()
    };

    this.http.post<any>(`${environment.apiUrl}/sizes`, payload).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.form.reset({ sizeName: '' });
        this.fetchSizes();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.errorMessage.set(err.error?.message || err.error || 'Failed to save size.');
        this.cdr.markForCheck();
      }
    });
  }
}
