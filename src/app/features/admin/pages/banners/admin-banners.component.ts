import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-admin-banners',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 page-enter">
      <!-- Create Banner (Left column) -->
      <div class="card p-5 h-fit space-y-4">
        <h2 class="font-bold text-base text-neutral-900 dark:text-white uppercase tracking-wider border-b pb-2">
          Create Banner
        </h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Banner Title</label>
            <input type="text" formControlName="title" class="input-field py-2" placeholder="e.g. Newborn Sale" />
            @if (form.get('title')?.invalid && form.get('title')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">Title is required.</p>
            }
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Image URL</label>
            <input type="text" formControlName="imageUrl" class="input-field py-2" placeholder="https://example.com/banner.jpg" />
            @if (form.get('imageUrl')?.invalid && form.get('imageUrl')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">Image URL is required.</p>
            }
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Link URL</label>
            <input type="text" formControlName="linkUrl" class="input-field py-2" placeholder="/products?category=newborn" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Position</label>
            <select formControlName="position" class="input-field py-2 text-xs">
              <option value="home_hero">Home Hero Section</option>
              <option value="home_strip">Promo Strip</option>
            </select>
          </div>
          <button type="submit" [disabled]="form.invalid || actionLoading()" class="btn-primary w-full py-2.5 text-xs font-bold shadow-pink">
            Create Banner
          </button>
        </form>
      </div>

      <!-- Banners Directory (Right column) -->
      <div class="lg:col-span-2 card p-5 space-y-4">
        <h2 class="font-bold text-base text-neutral-900 dark:text-white uppercase tracking-wider border-b pb-2">
          Banners Directory
        </h2>

        @if (loading()) {
          <div class="space-y-3">
            <div class="skeleton h-12 w-full rounded-xl"></div>
            <div class="skeleton h-12 w-full rounded-xl"></div>
          </div>
        } @else if (banners().length === 0) {
          <div class="text-center py-8 text-neutral-400">
            No promotional banners created yet.
          </div>
        } @else {
          <div class="grid grid-cols-1 gap-4">
            @for (ban of banners(); track ban._id) {
              <div class="border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-neutral-800 dark:border-neutral-700">
                <div class="flex items-center gap-4">
                  <img [src]="ban.imageUrl" class="w-16 h-10 object-cover rounded-lg bg-neutral-100 border flex-shrink-0" />
                  <div>
                    <h4 class="font-bold text-sm text-neutral-800 dark:text-white">{{ ban.title }}</h4>
                    <p class="text-[10px] text-neutral-400 font-mono">Position: {{ ban.position }} | Clicks: {{ ban.clicks || 0 }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-4 text-xs font-semibold w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                  <span [class.text-green-600]="ban.isActive" [class.text-neutral-400]="!ban.isActive">
                    {{ ban.isActive ? 'Active' : 'Disabled' }}
                  </span>
                  <button (click)="deleteBanner(ban._id)" class="text-red-500 font-bold hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminBannersComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  banners = signal<any[]>([]);
  loading = signal<boolean>(true);
  actionLoading = signal<boolean>(false);

  form = this.fb.group({
    title: ['', [Validators.required]],
    imageUrl: ['', [Validators.required]],
    linkUrl: [''],
    position: ['home_hero', [Validators.required]],
  });

  ngOnInit() {
    this.fetchBanners();
  }

  fetchBanners() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/banners`).subscribe({
      next: (res) => {
        this.banners.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  deleteBanner(id: string) {
    if (confirm('Are you sure you want to delete this banner?')) {
      this.http.delete<any>(`${environment.apiUrl}/banners/${id}`).subscribe({
        next: () => {
          this.banners.update((list) => list.filter((b) => b._id !== id));
          this.cdr.markForCheck();
        },
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.actionLoading.set(true);

    const payload = {
      title: this.form.value.title!.trim(),
      imageUrl: this.form.value.imageUrl!.trim(),
      linkUrl: this.form.value.linkUrl!.trim() || '/',
      position: this.form.value.position!,
      isActive: true,
    };

    this.http.post<any>(`${environment.apiUrl}/banners`, payload).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.form.reset({
          title: '',
          imageUrl: '',
          linkUrl: '',
          position: 'home_hero',
        });
        this.fetchBanners();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
