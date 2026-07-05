import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="card p-6 space-y-6 page-enter max-w-7xl mx-auto">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">
            {{ editMode() ? 'Edit Product Details' : 'Add New Product' }}
          </h2>
          <p class="text-neutral-500 text-xs mt-1">
            Specify pricing, variant details, and sizing specifications
          </p>
        </div>
        <a routerLink="/admin/products" class="btn-secondary text-xs py-2 px-4 font-bold flex items-center gap-1.5"><i class="pi pi-times"></i> Cancel</a>
      </div>

      @if (successMessage()) {
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
          {{ successMessage() }}
        </div>
      }

      @if (errorMessage()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {{ errorMessage() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Product Title <span class="text-red-500">*</span></label>
          <input type="text" formControlName="title" class="input-field py-2" placeholder="e.g. Premium Cotton Romper" />
        </div>

        <!-- Category & Brand side by side -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Category <span class="text-red-500">*</span></label>
            <select formControlName="categoryId" class="input-field py-2">
              <option value="">Select Category</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id.toString()">{{ cat.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Brand</label>
            <select formControlName="brand" class="input-field py-2 bg-white">
              <option value="">Select Brand...</option>
              @for (b of brands(); track b.brandId) {
                <option [value]="b.brandName">{{ b.brandName }}</option>
              }
            </select>
          </div>
        </div>

        @if (editMode() && form.get('sku')?.value) {
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">SKU (Auto-Generated)</label>
            <div class="py-2.5 px-3.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 rounded-xl text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300">
              {{ form.get('sku')?.value }}
            </div>
          </div>
        }

        <div class="flex flex-wrap gap-6 py-2">
          <div class="flex items-center gap-2">
            <input type="checkbox" id="isPublished" formControlName="isPublished" class="rounded text-primary-500 focus:ring-primary-500 w-4 h-4 cursor-pointer" />
            <label for="isPublished" class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">Publish immediately (visible in shop)</label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Detailed Description</label>
          <textarea formControlName="description" rows="4" class="input-field"></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Material Composition</label>
            <input type="text" formControlName="material" class="input-field py-2" placeholder="e.g. 100% Organic Cotton" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Care Instructions</label>
            <input type="text" formControlName="careInstructions" class="input-field py-2" placeholder="e.g. Machine wash cold" />
          </div>
        </div>

        <!-- Product Variants Section -->
        <div class="border-t pt-5 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-sm text-neutral-700 dark:text-white">Product Variants</h3>
              <p class="text-neutral-400 text-[11px] mt-0.5">Each variant has its own size, color, pricing, stock and images</p>
            </div>
            <button type="button" (click)="addVariant()" class="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-80" style="background: var(--color-primary-light); color: var(--color-primary);">
              <i class="pi pi-plus text-[10px]"></i> Add Variant
            </button>
          </div>

          <div formArrayName="variants" class="space-y-4">
            @for (vCtrl of variantsFormArray.controls; track $index) {
              <div [formGroupName]="$index" class="variant-card rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/30 overflow-hidden shadow-sm">
                <!-- Card Header -->
                <div class="flex items-center justify-between px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-100 dark:border-neutral-700">
                  <div class="flex items-center gap-2">
                    <div class="w-3.5 h-3.5 rounded-full border border-neutral-200 flex-shrink-0" [style.background]="vCtrl.get('colorHex')?.value || '#ccc'"></div>
                    <span class="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                      Variant #{{ $index + 1 }}
                      @if (vCtrl.get('size')?.value) { &mdash; {{ vCtrl.get('size')?.value }} }
                      @if (vCtrl.get('color')?.value) { / {{ vCtrl.get('color')?.value }} }
                    </span>
                  </div>
                  <button type="button" (click)="removeVariant($index)" class="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors" aria-label="Remove variant">
                    <i class="pi pi-times text-[10px]"></i>
                  </button>
                </div>

                <div class="p-4 space-y-4">
                  <!-- Fields row: Size | Color (picker + name) | Price | Disc. Price | Stock -->
                  <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div>
                      <label class="variant-label">Size</label>
                      <select formControlName="size" class="input-field py-1.5 text-xs bg-white">
                        <option value="">Select...</option>
                        @for (s of sizes(); track s.sizeId) {
                          <option [value]="s.sizeName">{{ s.sizeName }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="variant-label">Color</label>
                      <div class="flex gap-1.5">
                        <input type="color" formControlName="colorHex" class="w-9 h-9 rounded-lg border border-neutral-200 cursor-pointer p-0.5 bg-transparent flex-shrink-0" title="Pick color" />
                        <input type="text" formControlName="color" class="input-field py-1.5 text-xs flex-1 min-w-0" placeholder="e.g. White" />
                      </div>
                    </div>
                    <div>
                      <label class="variant-label">Price (&#8377;) <span class="text-red-500">*</span></label>
                      <input type="number" formControlName="price" class="input-field py-1.5 text-xs" placeholder="0" />
                    </div>
                    <div>
                      <label class="variant-label">Disc. Price (&#8377;)</label>
                      <input type="number" formControlName="discountPrice" class="input-field py-1.5 text-xs" placeholder="None" />
                    </div>
                    <div>
                      <label class="variant-label">Stock Qty <span class="text-red-500">*</span></label>
                      <input type="number" formControlName="stock" class="input-field py-1.5 text-xs" />
                    </div>
                  </div>

                  <!-- Images upload row -->
                  <div>
                    <label class="variant-label mb-2">Variant Images</label>
                    <div class="flex flex-wrap items-start gap-3">
                      <!-- Uploaded thumbnails -->
                      @for (imgUrl of (vCtrl.get('images')?.value || []); track imgUrl) {
                        <div class="relative group flex-shrink-0">
                          <div class="w-16 h-16 rounded-xl overflow-hidden border-2 border-neutral-200 shadow-sm bg-neutral-100">
                            <img [src]="imgUrl" class="w-full h-full object-cover" alt="Variant image" />
                          </div>
                          <button type="button"
                                  (click)="removeVariantImage($index, imgUrl)"
                                  class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-150 hover:scale-110">
                            <i class="pi pi-times text-[9px]"></i>
                          </button>
                        </div>
                      }

                      <!-- Per-variant upload trigger -->
                      <label class="flex-shrink-0 cursor-pointer">
                        <input type="file" multiple accept="image/*" class="hidden"
                               (change)="uploadVariantImages($index, $event)" />
                        @if (uploadingVariantIdx() === $index) {
                          <div class="w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1" style="border-color: var(--color-primary); background: var(--color-primary-light);">
                            <svg class="animate-spin w-4 h-4" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span class="text-[9px] font-bold" style="color: var(--color-primary);">Uploading</span>
                          </div>
                        } @else {
                          <div class="w-16 h-16 rounded-xl border-2 border-dashed border-neutral-200 hover:border-primary bg-neutral-50 hover:bg-neutral-100 flex flex-col items-center justify-center gap-1 transition-all duration-200">
                            <i class="pi pi-cloud-upload text-neutral-400 text-base"></i>
                            <span class="text-[9px] font-bold text-neutral-400">Upload</span>
                          </div>
                        }
                      </label>
                    </div>
                    @if ((vCtrl.get('images')?.value || []).length === 0 && uploadingVariantIdx() !== $index) {
                      <p class="text-[10px] text-neutral-400 mt-1.5 italic">Click the upload box to add images for this variant</p>
                    }
                  </div>
                </div>
              </div>
            }

            @if (variantsFormArray.controls.length === 0) {
              <div class="text-center py-10 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700">
                <i class="pi pi-box text-4xl text-neutral-300"></i>
                <p class="text-sm font-bold text-neutral-400 mt-2">No variants added yet</p>
                <p class="text-xs text-neutral-300 mt-0.5">Click "Add Variant" above to get started</p>
              </div>
            }
          </div>
        </div>

        <!-- Form actions -->
        <div class="pt-6 border-t border-neutral-100 dark:border-neutral-700 flex justify-end gap-3">
          <a routerLink="/admin/products" class="btn-secondary py-3 px-6 text-xs font-bold">Cancel</a>
          <button type="submit" [disabled]="form.invalid || submitting()" class="btn-primary py-3 px-8 text-xs font-bold flex items-center gap-2">
            @if (submitting()) {
              <svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            }
            {{ editMode() ? 'Update Product' : 'Create Product' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .variant-label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }
    .variant-card {
      transition: box-shadow 0.2s;
    }
    .variant-card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
  `]
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private routeSub!: Subscription;

  editMode = signal<boolean>(false);
  productId = signal<string | null>(null);
  categories = signal<any[]>([]);
  brands = signal<any[]>([]);
  sizes = signal<any[]>([]);
  submitting = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  uploadingVariantIdx = signal<number | null>(null);

  readonly colorHexMap: Record<string, string> = {
    red: '#dc2626',
    blue: '#2563EB',
    green: '#16A34A',
    sandal: '#E8D9C5',
    beige: '#FAF8F5',
    brown: '#A67C52',
    pink: '#EC4899',
    yellow: '#F59E0B',
    white: '#FFFFFF',
    black: '#171717',
    grey: '#6B7280',
    gray: '#6B7280',
    orange: '#EA580C',
    purple: '#7C3AED',
    cream: '#FFFDD0',
    mustard: '#D97706',
    gold: '#D97706',
    denim: '#3B82F6',
    navy: '#1E3A8A',
    peach: '#FFD3B6',
    mint: '#A8E6CF',
    lavender: '#E8E8FF',
    coral: '#FF8B94',
    rose: '#FDA4AF',
  };

  generateVariantSku(baseSku: string, size: string, color: string): string {
    if (!baseSku) return '';
    
    let sizeCode = (size || '').trim().toUpperCase();
    if (sizeCode.includes('MONTH')) {
      sizeCode = sizeCode.replace(/\s*MONTHS?/g, 'M').replace(/\s+/g, '');
    } else if (sizeCode.includes('YEAR')) {
      sizeCode = sizeCode.replace(/\s*YEARS?/g, 'Y').replace(/\s+/g, '');
    } else {
      sizeCode = sizeCode.replace(/[^A-Z0-9-]/g, '');
    }
    
    let colorCode = (color || '').trim().replace(/[^a-zA-Z0-9\s]/g, '').toUpperCase();
    const colorWords = colorCode.split(/\s+/);
    if (colorWords.length > 1) {
      colorCode = colorWords.map(w => w.charAt(0)).join('');
    } else {
      colorCode = colorCode.substring(0, 3);
    }

    let sku = baseSku.trim().toUpperCase();
    if (sizeCode) sku += '-' + sizeCode;
    if (colorCode) sku += '-' + colorCode;
    
    return sku;
  }

  getColorNameFromHex(hex: string): string {
    if (!hex) return 'Custom';
    const cleanHex = hex.trim().toUpperCase();
    
    // Exact match
    for (const [name, value] of Object.entries(this.colorHexMap)) {
      if (value.toUpperCase() === cleanHex) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
    
    // Parse target hex
    if (!cleanHex.startsWith('#') || cleanHex.length !== 7) return 'Custom';
    const r = parseInt(cleanHex.substring(1, 3), 16);
    const g = parseInt(cleanHex.substring(3, 5), 16);
    const b = parseInt(cleanHex.substring(5, 7), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) return 'Custom';

    let closestName = 'Custom';
    let minDistance = Infinity;
    
    for (const [name, value] of Object.entries(this.colorHexMap)) {
      const vr = parseInt(value.substring(1, 3), 16);
      const vg = parseInt(value.substring(3, 5), 16);
      const vb = parseInt(value.substring(5, 7), 16);
      
      const distance = Math.sqrt(
        Math.pow(r - vr, 2) + 
        Math.pow(g - vg, 2) + 
        Math.pow(b - vb, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestName = name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
    
    return closestName;
  }

  setupVariantControl(group: FormGroup) {
    const updateSkuAndHex = () => {
      const size = group.get('size')?.value || '';
      const color = group.get('color')?.value || '';
      const baseSku = this.form.get('sku')?.value || '';
      
      const colorLower = color.trim().toLowerCase();
      const matchedHex = this.colorHexMap[colorLower] || this.colorHexMap[colorLower.split(/\s+/)[0]];
      if (matchedHex) {
        group.get('colorHex')?.setValue(matchedHex, { emitEvent: false });
      }
      
      const genSku = this.generateVariantSku(baseSku, size, color);
      if (genSku) {
        group.get('sku')?.setValue(genSku, { emitEvent: false });
      }
    };

    group.get('size')?.valueChanges.subscribe(() => updateSkuAndHex());
    
    group.get('color')?.valueChanges.subscribe((colorName) => {
      const colorLower = (colorName || '').trim().toLowerCase();
      const matchedHex = this.colorHexMap[colorLower] || this.colorHexMap[colorLower.split(/\s+/)[0]];
      if (matchedHex) {
        group.get('colorHex')?.setValue(matchedHex, { emitEvent: false });
      }
      
      const size = group.get('size')?.value || '';
      const baseSku = this.form.get('sku')?.value || '';
      const genSku = this.generateVariantSku(baseSku, size, colorName);
      if (genSku) {
        group.get('sku')?.setValue(genSku, { emitEvent: false });
      }
    });

    group.get('colorHex')?.valueChanges.subscribe((hex) => {
      if (hex) {
        const colorName = this.getColorNameFromHex(hex);
        group.get('color')?.setValue(colorName, { emitEvent: false });
        
        const size = group.get('size')?.value || '';
        const baseSku = this.form.get('sku')?.value || '';
        const genSku = this.generateVariantSku(baseSku, size, colorName);
        if (genSku) {
          group.get('sku')?.setValue(genSku, { emitEvent: false });
        }
      }
    });
  }


  removeVariantImage(index: number, imgUrl: string) {
    const ctrl = this.variantsFormArray.at(index);
    if (ctrl) {
      const current = (ctrl.get('images')?.value as string[] || []).filter((u: string) => u !== imgUrl);
      ctrl.get('images')?.setValue(current);
      ctrl.get('imageUrl')?.setValue(current[0] || '');
    }
    this.cdr.detectChanges();
  }

  uploadVariantImages(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.uploadingVariantIdx.set(index);
    this.errorMessage.set('');
    this.cdr.detectChanges();

    const formData = new FormData();
    for (let i = 0; i < input.files.length; i++) {
      formData.append('files', input.files[i]);
    }
    input.value = '';

    this.http.post<any>(`${environment.apiUrl}/upload/multiple`, formData).subscribe({
      next: (res) => {
        const newUrls: string[] = res.urls || res.data?.urls || (Array.isArray(res.data) ? res.data : []);
        const ctrl = this.variantsFormArray.at(index);
        if (ctrl) {
          const existing = (ctrl.get('images')?.value as string[] || []);
          const merged = [...existing, ...newUrls.filter((u: string) => !existing.includes(u))];
          ctrl.get('images')?.setValue(merged);
          ctrl.get('imageUrl')?.setValue(merged[0] || '');
          // Also push to global images array to keep FormArray in sync
          newUrls.forEach((url: string) => {
            if (!(this.imagesFormArray.value as string[]).includes(url)) {
              this.imagesFormArray.push(this.fb.control(url));
            }
          });
        }
        this.uploadingVariantIdx.set(null);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Failed to upload images for this variant.');
        this.uploadingVariantIdx.set(null);
        this.cdr.detectChanges();
      }
    });
  }

  form = this.fb.group({
    title: ['', [Validators.required]],
    sku: [''],
    categoryId: ['', [Validators.required]],
    price: [null],
    discountPrice: [null],
    brand: [''],
    shortDescription: [''],
    description: [''],
    material: [''],
    careInstructions: [''],
    tagsInput: [''],
    isPublished: [true],
    isComboOffer: [false],
    variants: this.fb.array([]),
    images: this.fb.array([]),
  });

  get variantsFormArray() {
    return this.form.get('variants') as FormArray;
  }

  get imagesFormArray() {
    return this.form.get('images') as FormArray;
  }

  checkAndSetComboOfferState(categoryId: any) {
    const catIdStr = String(categoryId?._id || categoryId?.id || categoryId || '');
    const combosCat = this.categories().find(c => c.slug === 'combos');
    const isCombo = (combosCat && String(combosCat.id) === catIdStr) || 
                    (categoryId && categoryId.slug === 'combos');
                    
    if (isCombo) {
      this.form.get('isComboOffer')?.setValue(true, { emitEvent: false });
      this.form.get('categoryId')?.setValue(catIdStr);
      this.form.get('categoryId')?.disable();
    } else {
      this.form.get('isComboOffer')?.setValue(false, { emitEvent: false });
      this.form.get('categoryId')?.enable();
    }
  }

  ngOnInit() {
    this.loadCategories();
    this.loadBrands();
    this.loadSizes();
    this.routeSub = this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.editMode.set(true);
        this.productId.set(id);
        this.loadProductDetails(id);
      } else {
        // Preset default variant for creation convenience
        this.addVariant();
      }
    });

    // Sync variants' first item price to main product price for database integrity
    this.variantsFormArray.valueChanges.subscribe(() => {
      const list = this.variantsFormArray.value;
      if (list && list.length > 0) {
        const first = list[0];
        this.form.get('price')?.setValue(first.price || 0, { emitEvent: false });
        this.form.get('discountPrice')?.setValue(first.discountPrice || null, { emitEvent: false });
      }
    });

    // Auto-update variant SKUs when base SKU changes
    this.form.get('sku')?.valueChanges.subscribe((baseSku) => {
      this.variantsFormArray.controls.forEach((ctrl) => {
        const size = ctrl.get('size')?.value || '';
        const color = ctrl.get('color')?.value || '';
        const genSku = this.generateVariantSku(baseSku || '', size, color);
        if (genSku) {
          ctrl.get('sku')?.setValue(genSku, { emitEvent: false });
        }
      });
      this.cdr.detectChanges();
    });

    // Combo Offer value change logic
    this.form.get('isComboOffer')?.valueChanges.subscribe((isCombo) => {
      if (isCombo) {
        const combosCat = this.categories().find((c) => c.slug === 'combos');
        if (combosCat) {
          this.form.get('categoryId')?.setValue(String(combosCat.id));
          this.form.get('categoryId')?.disable();
        }
      } else {
        this.form.get('categoryId')?.enable();
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.routeSub) this.routeSub.unsubscribe();
  }

  loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
        if (this.form.get('isComboOffer')?.value) {
          const combosCat = this.categories().find((c) => c.slug === 'combos');
          if (combosCat) {
            this.form.get('categoryId')?.setValue(String(combosCat.id));
            this.form.get('categoryId')?.disable();
          }
        }
        this.cdr.detectChanges();
      },
    });
  }

  loadBrands() {
    this.http.get<any>(`${environment.apiUrl}/brands`).subscribe({
      next: (res) => {
        this.brands.set(res.data || []);
        this.cdr.detectChanges();
      }
    });
  }

  loadSizes() {
    this.http.get<any>(`${environment.apiUrl}/sizes`).subscribe({
      next: (res) => {
        this.sizes.set(res.data || []);
        this.cdr.detectChanges();
      }
    });
  }

  loadProductDetails(id: string) {
    this.http.get<any>(`${environment.apiUrl}/products/${id}`).subscribe({
      next: (res) => {
        const prod = res.data;
        if (!prod) return;

        this.form.patchValue({
          title: prod.title,
          sku: prod.sku,
          categoryId: String(prod.categoryId?._id || prod.categoryId?.id || prod.categoryId || ''),
          price: prod.price,
          discountPrice: prod.discountPrice || null,
          brand: prod.brand || '',
          shortDescription: prod.shortDescription || '',
          description: prod.description || '',
          material: prod.material || '',
          careInstructions: prod.careInstructions || '',
          tagsInput: (prod.tags || []).join(', '),
          isPublished: prod.isPublished,
        });

        // Set Images
        this.imagesFormArray.clear();
        if (prod.images?.length > 0) {
          prod.images.forEach((img: string) => {
            this.imagesFormArray.push(this.fb.control(img));
          });
        }

        // Set Variants
        this.variantsFormArray.clear();
        if (prod.variants?.length > 0) {
          prod.variants.forEach((v: any) => {
            const group = this.fb.group({
              sku: [v.sku],
              size: [v.size || ''],
              color: [v.color || ''],
              colorHex: [v.colorHex || '#ffffff'],
              imageUrl: [v.imageUrl || ''],
              images: [v.images || (v.imageUrl ? [v.imageUrl] : [])],
              stock: [v.stock || 0, Validators.required],
              price: [v.price || prod.price || null],
              discountPrice: [v.discountPrice || prod.discountPrice || null],
            });

            this.setupVariantControl(group);
            this.variantsFormArray.push(group);
          });
        }

        // Handle category selection for Combo Offers
        this.checkAndSetComboOfferState(prod.categoryId);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage.set('Failed to load product details.');
        this.cdr.detectChanges();
      }
    });
  }

  addVariant() {
    const group = this.fb.group({
      sku: [''],
      size: ['M'],
      color: ['White'],
      colorHex: ['#ffffff'],
      imageUrl: [''],
      images: [[]],
      stock: [10, Validators.required],
      price: [null],
      discountPrice: [null],
    });

    this.setupVariantControl(group);
    this.variantsFormArray.push(group);
    
    // Trigger initial values
    const size = group.get('size')?.value || '';
    const color = group.get('color')?.value || '';
    const baseSku = this.form.get('sku')?.value || '';
    const colorLower = color.trim().toLowerCase();
    const matchedHex = this.colorHexMap[colorLower] || '#ffffff';
    group.get('colorHex')?.setValue(matchedHex, { emitEvent: false });
    const genSku = this.generateVariantSku(baseSku, size, color);
    if (genSku) {
      group.get('sku')?.setValue(genSku, { emitEvent: false });
    }
  }

  removeVariant(index: number) {
    this.variantsFormArray.removeAt(index);
  }



  onSubmit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const formVal = this.form.getRawValue();

    const variants = (formVal.variants || []).map((v: any) => ({
      sku: v.sku,
      size: v.size || 'One Size',
      color: v.color || 'Natural',
      colorHex: v.colorHex || '#ede0d4',
      imageUrl: v.imageUrl || null,
      images: v.images || [],
      stock: Number(v.stock || 0),
      price: v.price ? Number(v.price) : null,
      discountPrice: v.discountPrice ? Number(v.discountPrice) : null
    }));

    const firstVariant = variants[0];

    // Build payload matching backend schemas
    const payload = {
      title: formVal.title,
      sku: formVal.sku,
      categoryId: formVal.categoryId ? Number(formVal.categoryId) : 0,
      price: firstVariant?.price ?? Number(formVal.price ?? 0),
      discountPrice: firstVariant?.discountPrice ?? (formVal.discountPrice ? Number(formVal.discountPrice) : undefined),
      brand: formVal.brand,
      shortDescription: formVal.shortDescription,
      description: formVal.description,
      material: formVal.material,
      careInstructions: formVal.careInstructions,
      tags: formVal.tagsInput ? formVal.tagsInput.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      variants,
      images: (formVal.images as any[] || []).filter((i: any) => !!i),
      isPublished: !!formVal.isPublished,
    };

    const id = this.productId();
    const request$ = this.editMode()
      ? this.http.put<any>(`${environment.apiUrl}/products/${id}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/products`, payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.successMessage.set(this.editMode() ? 'Product updated successfully.' : 'Product created successfully.');
        setTimeout(() => this.router.navigate(['/admin/products']), 1500);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to save product details.');
        this.cdr.detectChanges();
      },
    });
  }
}
