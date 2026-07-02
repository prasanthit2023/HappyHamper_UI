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
    <div class="space-y-6 page-enter">
      <!-- Create / Edit Category Form (Top) -->
      <div class="card p-5 space-y-4">
        <h2 class="font-bold text-base text-neutral-900 uppercase tracking-wider border-b pb-2">
          {{ editingId() ? 'Edit Category' : 'Create Category' }}
        </h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col md:flex-row items-end gap-5">
          <div class="flex-1 w-full">
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Name</label>
            <input type="text" formControlName="name" class="input-field py-2" placeholder="e.g. Rompers" />
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">Name is required.</p>
            }
          </div>
          <div class="flex-[2] w-full">
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Description</label>
            <input type="text" formControlName="description" class="input-field py-2" placeholder="Describe category..." />
          </div>
          <div class="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-shrink-0">
            <button type="submit" [disabled]="form.invalid || actionLoading()" class="btn-primary py-2 px-6 text-xs font-bold w-full sm:w-auto flex-shrink-0" style="height: 38px;">
              {{ editingId() ? 'Update Category' : 'Create Category' }}
            </button>
            @if (editingId()) {
              <button type="button" (click)="cancelEdit()" class="btn-secondary py-2 px-6 text-xs font-bold w-full sm:w-auto flex-shrink-0" style="height: 38px;">
                Cancel
              </button>
            }
          </div>
        </form>
      </div>

      <!-- Categories List (Bottom) -->
      <div class="card p-5 space-y-4">
        <h2 class="font-bold text-base text-neutral-900 uppercase tracking-wider border-b pb-2">
          Categories Directory
        </h2>
 
        @if (loading()) {
          <div class="space-y-3">
            <div class="skeleton h-12 w-full rounded-xl"></div>
            <div class="skeleton h-12 w-full rounded-xl"></div>
            <div class="skeleton h-12 w-full rounded-xl"></div>
            <div class="skeleton h-12 w-full rounded-xl"></div>
          </div>
        } @else if (categories().length === 0) {
          <div class="text-center py-8 text-neutral-400">
            No categories defined yet.
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Slug Reference</th>
                  <th>Description</th>
                  <th class="w-32 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of categories(); track cat._id) {
                  <tr class="hover:bg-neutral-50 transition-colors duration-150">
                    <td>
                      <span class="font-bold text-neutral-800">{{ cat.name }}</span>
                    </td>
                    <td>
                      <span class="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-500 border border-neutral-200">
                        {{ cat.slug }}
                      </span>
                    </td>
                    <td class="text-neutral-600 max-w-xs truncate" [title]="cat.description || ''">
                      {{ cat.description || '-' }}
                    </td>
                    <td class="text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button
                          (click)="startEdit(cat)"
                          class="w-7 h-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center text-xs transition-all duration-200"
                          title="Edit Category"
                        >
                          <i class="pi pi-pencil"></i>
                        </button>
                        <button
                          (click)="deleteCategory(cat._id)"
                          class="w-7 h-7 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center text-xs transition-all duration-200"
                          title="Delete Category"
                        >
                          <i class="pi pi-times"></i>
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
export class AdminCategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private confirmService = inject(ConfirmService);
 
  categories = signal<any[]>([]);
  loading = signal<boolean>(true);
  actionLoading = signal<boolean>(false);
  editingId = signal<any | null>(null);
 
  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
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

  startEdit(cat: any) {
    this.editingId.set(cat._id || cat.id);
    this.form.patchValue({
      name: cat.name,
      description: cat.description || '',
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form.reset({
      name: '',
      description: '',
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
    };
 
    const editId = this.editingId();
    if (editId) {
      this.http.put<any>(`${environment.apiUrl}/categories/${editId}`, payload).subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          this.cancelEdit();
          this.fetchCategories();
        },
        error: () => {
          this.actionLoading.set(false);
          this.cdr.markForCheck();
        },
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/categories`, payload).subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          this.form.reset({
            name: '',
            description: '',
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
}
