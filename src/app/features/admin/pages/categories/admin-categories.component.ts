import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 page-enter">
      <!-- Create Category Form (Left column) -->
      <div class="card p-5 h-fit space-y-4">
        <h2 class="font-bold text-base text-neutral-900 dark:text-white uppercase tracking-wider border-b pb-2">
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
          <button type="submit" [disabled]="form.invalid || actionLoading()" class="btn-primary w-full py-2.5 text-xs font-bold">
            Create Category
          </button>
        </form>
      </div>

      <!-- Categories List (Right columns) -->
      <div class="lg:col-span-2 card p-5 space-y-4">
        <h2 class="font-bold text-base text-neutral-900 dark:text-white uppercase tracking-wider border-b pb-2">
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
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (cat of categories(); track cat._id) {
              <div class="border rounded-2xl p-4 flex justify-between items-center bg-white dark:bg-neutral-800 dark:border-neutral-700">
                <div>
                  <h4 class="font-bold text-sm text-neutral-800 dark:text-white">{{ cat.name }}</h4>
                  <p class="text-[10px] text-neutral-400 font-mono">Slug: {{ cat.slug }}</p>
                  @if (cat.description) {
                    <p class="text-xs text-neutral-500 mt-1 leading-snug">{{ cat.description }}</p>
                  }
                </div>
                <button
                  (click)="deleteCategory(cat._id)"
                  class="w-7 h-7 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-xs font-bold transition-colors"
                  aria-label="Delete category"
                >
                  <i class="pi pi-times"></i>
                </button>
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

  categories = signal<any[]>([]);
  loading = signal<boolean>(true);
  actionLoading = signal<boolean>(false);

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    color: ['linear-gradient(135deg, #f8fafc, #e2e8f0)'],
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
    if (confirm('Are you sure you want to delete this category? All products using it will need reassignment.')) {
      this.http.delete<any>(`${environment.apiUrl}/categories/${id}`).subscribe({
        next: () => {
          this.categories.update((list) => list.filter((c) => c._id !== id));
          this.cdr.markForCheck();
        },
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.actionLoading.set(true);

    const payload = {
      name: this.form.value.name!.trim(),
      description: this.form.value.description?.trim() || '',
      color: this.form.value.color?.trim() || 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
    };

    this.http.post<any>(`${environment.apiUrl}/categories`, payload).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        this.form.reset({
          name: '',
          description: '',
          color: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
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
