import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'bb-admin-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 page-enter">
      <!-- Create Category Form (Left column) -->
      <div class="card p-5 h-fit space-y-4">
        <h2 class="font-bold text-base text-neutral-900 uppercase tracking-wider border-b pb-2">
          Create Category
        </h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Name</label>
            <input type="text" formControlName="name" class="input-field py-2" placeholder="e.g. Rompers" />
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">Name is required.</p>
            }
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Description</label>
            <input type="text" formControlName="description" class="input-field py-2" placeholder="Describe category..." />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-2">Card Accent Color</label>
            <div class="grid grid-cols-4 gap-2">
              @for (grad of gradientOptions; track grad.name) {
                <button
                  type="button"
                  (click)="form.patchValue({color: grad.value})"
                  class="h-8 rounded-lg border transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95"
                  [style.background]="grad.value"
                  [class.border-neutral-900]="form.value.color === grad.value"
                  [class.scale-105]="form.value.color === grad.value"
                  [class.border-neutral-200]="form.value.color !== grad.value"
                  [title]="grad.name"
                >
                  @if (form.value.color === grad.value) {
                    <i class="pi pi-check text-[10px] text-neutral-800"></i>
                  }
                </button>
              }
            </div>
          </div>
          <button type="submit" [disabled]="form.invalid || actionLoading()" class="btn-primary w-full py-2.5 text-xs font-bold mt-2">
            Create Category
          </button>
        </form>
      </div>

      <!-- Categories List (Right columns) -->
      <div class="lg:col-span-2 card p-5 space-y-4">
        <h2 class="font-bold text-base text-neutral-900 uppercase tracking-wider border-b pb-2">
          Categories Directory
        </h2>

        @if (loading()) {
          <div class="space-y-3">
            <div class="skeleton h-12 w-full rounded-xl"></div>
            <div class="skeleton h-12 w-full rounded-xl"></div>
          </div>
        } @else if (categories().length === 0) {
          <div class="text-center py-8 text-neutral-400">
            No categories defined yet.
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            @for (cat of categories(); track cat._id) {
              <div class="relative group rounded-2xl p-5 border flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                   [style.background]="cat.color || 'var(--color-bg-subtle)'"
                   style="border-color: var(--color-border);">
                <div>
                  <div class="flex items-center justify-between gap-3 mb-2.5">
                    <h4 class="font-bold text-base text-neutral-800">{{ cat.name }}</h4>
                    <button
                      (click)="deleteCategory(cat._id)"
                      class="w-7 h-7 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center text-xs font-bold transition-all duration-200"
                      aria-label="Delete category"
                    >
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                  <p class="text-[10px] text-neutral-400 font-mono">Slug: {{ cat.slug }}</p>
                  @if (cat.description) {
                    <p class="text-xs text-neutral-600 mt-2.5 leading-relaxed">{{ cat.description }}</p>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminCategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private confirmService = inject(ConfirmService);

  categories = signal<any[]>([]);
  loading = signal<boolean>(true);
  actionLoading = signal<boolean>(false);

  gradientOptions = [
    { name: 'Soft Bluebell', value: 'linear-gradient(135deg, #F0F1FA 0%, #E2E4F6 100%)' },
    { name: 'Warm Sandal',   value: 'linear-gradient(135deg, #F4F2F0 0%, #EBE8E5 100%)' },
    { name: 'Sweet Peach',   value: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)' },
    { name: 'Mint Green',    value: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' },
    { name: 'Soft Lavender', value: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)' },
    { name: 'Teal Dream',    value: 'linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)' },
    { name: 'Sunny Yellow',  value: 'linear-gradient(135deg, #FEFCE8 0%, #FEF9C3 100%)' },
    { name: 'Cream Beige',   value: 'linear-gradient(135deg, #FAF6EE 0%, #F3EDE0 100%)' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    color: ['linear-gradient(135deg, #F0F1FA 0%, #E2E4F6 100%)'],
  });

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  deleteCategory(id: string) {
    this.confirmService.confirm({
      message: 'Are you sure you want to delete this category? All products using it will need reassignment.',
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.http.delete<any>(`${environment.apiUrl}/categories/${id}`).subscribe({
          next: () => {
            this.categories.update((list) => list.filter((c) => c._id !== id));
            this.cdr.markForCheck();
          },
        });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.actionLoading.set(true);

    const payload = {
      name: this.form.value.name!.trim(),
      description: this.form.value.description?.trim() || '',
      color: this.form.value.color?.trim() || 'linear-gradient(135deg, #F0F1FA 0%, #E2E4F6 100%)',
    };

    this.http.post<any>(`${environment.apiUrl}/categories`, payload).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        this.form.reset({
          name: '',
          description: '',
          color: 'linear-gradient(135deg, #F0F1FA 0%, #E2E4F6 100%)',
        });
        this.fetchCategories();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
