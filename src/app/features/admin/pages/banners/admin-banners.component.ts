import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'bb-admin-banners',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 page-enter animate-fade-in bg-neutral-50/20 p-1">
      
      <!-- Create Banner (Left column) -->
      <div class="card p-6 h-fit space-y-5 bg-white border border-beige">
        <h2 class="font-bold text-sm text-neutral-800 uppercase tracking-wider border-b border-beige pb-3 flex items-center gap-2">
          <i class="pi pi-plus-circle text-primary"></i>
          Create Banner
        </h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-neutral-500 mb-1.5">Banner Title</label>
            <input type="text" formControlName="title" class="input-field py-2" placeholder="e.g. Newborn Autumn Sale" />
            @if (form.get('title')?.invalid && form.get('title')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">Title is required.</p>
            }
          </div>
          <div>
            <label class="block text-xs font-bold text-neutral-500 mb-1.5">Image URL</label>
            <input type="text" formControlName="imageUrl" class="input-field py-2" placeholder="https://images.unsplash.com/photo-..." />
            @if (form.get('imageUrl')?.invalid && form.get('imageUrl')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">Image URL is required.</p>
            }
          </div>
          <div>
            <label class="block text-xs font-bold text-neutral-500 mb-1.5">Link Path / URL</label>
            <input type="text" formControlName="link" class="input-field py-2" placeholder="e.g. /products?newArrival=true" />
          </div>
          <div>
            <label class="block text-xs font-bold text-neutral-500 mb-1.5">Position</label>
            <select formControlName="position" class="input-field py-2 text-xs">
              <option value="hero">Home Hero Section</option>
              <option value="middle_banner">Promo Strip</option>
            </select>
          </div>
          <button type="submit" [disabled]="form.invalid || actionLoading()" class="btn-primary w-full py-2.5 text-xs font-bold shadow-pink flex items-center justify-center gap-2">
            @if (actionLoading()) {
              <i class="pi pi-spinner animate-spin"></i>
            }
            Create Banner
          </button>
        </form>
      </div>

      <!-- Banners Directory (Right column) -->
      <div class="lg:col-span-2 card p-6 space-y-5 bg-white border border-beige">
        <div class="flex items-center justify-between border-b border-beige pb-3">
          <h2 class="font-bold text-sm text-neutral-800 uppercase tracking-wider flex items-center gap-2">
            <i class="pi pi-images text-primary"></i>
            Banners Directory
          </h2>
          <span class="text-xs text-neutral-500 font-semibold">{{ banners().length }} Total Banners</span>
        </div>

        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (_ of [1,2]; track $index) {
              <div class="skeleton h-48 w-full rounded-2xl"></div>
            }
          </div>
        } @else if (banners().length === 0) {
          <div class="empty-state">
            <div class="empty-state-icon text-neutral-400">
              <i class="pi pi-image text-3xl"></i>
            </div>
            <div class="empty-state-title text-neutral-700">No banners found</div>
            <div class="empty-state-sub text-neutral-500">Create promotional banners using the form on the left.</div>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            @for (ban of banners(); track ban._id || ban.id) {
              <div class="group relative border border-beige rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
                
                <!-- Banner Image Card -->
                <div class="aspect-[16/9] w-full bg-neutral-100 relative overflow-hidden border-b border-beige">
                  <img [src]="ban.imageUrl" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102" />
                  
                  <!-- Drag Handle Decor & Position Indicator -->
                  <div class="absolute top-3 left-3 flex gap-1.5 items-center">
                    <span class="cursor-grab text-white bg-black/60 hover:bg-black/80 px-2 py-1 rounded-md text-[10px] flex items-center gap-1 font-mono">
                      <i class="pi pi-bars text-[10px]"></i>
                      Sort: {{ ban.sortOrder || 0 }}
                    </span>
                    <span class="bg-primary text-white font-bold px-2 py-1 rounded-md text-[9px] uppercase tracking-wider">
                      {{ ban.position === 'hero' ? 'Hero' : 'Promo Strip' }}
                    </span>
                  </div>

                  <!-- Quick Active Toggle Overlay -->
                  <button (click)="toggleActive(ban._id || ban.id, ban.isActive)" 
                          [class]="ban.isActive ? 'bg-emerald-500 text-white' : 'bg-neutral-500 text-white'"
                          class="absolute top-3 right-3 shadow px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95">
                    <span class="w-1.5 h-1.5 rounded-full bg-white" [class.animate-pulse]="ban.isActive"></span>
                    {{ ban.isActive ? 'Active' : 'Disabled' }}
                  </button>
                </div>

                <!-- Banner Content Details -->
                <div class="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div class="space-y-1">
                    <h4 class="font-bold text-sm text-neutral-800 leading-snug group-hover:text-primary transition-colors">
                      {{ ban.title }}
                    </h4>
                    <p class="text-xs text-neutral-500 truncate" [title]="ban.link">
                      <i class="pi pi-link text-[10px] mr-1"></i>{{ ban.link || '/' }}
                    </p>
                  </div>

                  <div class="flex items-center justify-between pt-3 border-t border-beige">
                    <div class="flex items-center gap-3 text-[10px] font-semibold text-neutral-400">
                      <span class="flex items-center gap-1">
                        <i class="pi pi-eye"></i> Views: {{ ban.viewCount || 0 }}
                      </span>
                      <span class="flex items-center gap-1">
                        <i class="pi pi-percentage"></i> Clicks: {{ ban.clickCount || ban.clicks || 0 }}
                      </span>
                    </div>

                    <button (click)="deleteBanner(ban._id || ban.id)" class="text-neutral-400 hover:text-red-500 transition-colors p-1" title="Delete Banner">
                      <i class="pi pi-trash text-sm"></i>
                    </button>
                  </div>
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
  private confirmService = inject(ConfirmService);

  banners = signal<any[]>([]);
  loading = signal<boolean>(true);
  actionLoading = signal<boolean>(false);

  form = this.fb.group({
    title: ['', [Validators.required]],
    imageUrl: ['', [Validators.required]],
    link: ['/'],
    position: ['hero', [Validators.required]],
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

  toggleActive(id: string, currentStatus: boolean) {
    const nextStatus = !currentStatus;
    this.http.put<any>(`${environment.apiUrl}/banners/${id}`, { isActive: nextStatus }).subscribe({
      next: () => {
        this.banners.update((list) =>
          list.map((b) => ((b._id || b.id) === id ? { ...b, isActive: nextStatus } : b))
        );
        this.cdr.markForCheck();
      },
    });
  }

  deleteBanner(id: string) {
    this.confirmService.confirm({
      message: 'Are you sure you want to delete this banner?',
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.http.delete<any>(`${environment.apiUrl}/banners/${id}`).subscribe({
          next: () => {
            this.banners.update((list) => list.filter((b) => (b._id || b.id) !== id));
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
      title: this.form.value.title!.trim(),
      imageUrl: this.form.value.imageUrl!.trim(),
      link: this.form.value.link!.trim() || '/',
      position: this.form.value.position!,
      isActive: true,
    };

    this.http.post<any>(`${environment.apiUrl}/banners`, payload).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.form.reset({
          title: '',
          imageUrl: '',
          link: '/',
          position: 'hero',
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
