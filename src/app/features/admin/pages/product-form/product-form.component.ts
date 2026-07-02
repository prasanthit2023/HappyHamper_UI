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
    <div class="card p-6 space-y-6 page-enter max-w-2xl mx-auto">
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
          <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Product Title</label>
          <input type="text" formControlName="title" class="input-field py-2" placeholder="e.g. Premium Cotton Romper" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">SKU</label>
            <input type="text" formControlName="sku" class="input-field py-2" placeholder="Leave blank to auto-generate" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Category</label>
            <select formControlName="categoryId" class="input-field py-2">
              <option value="">Select Category</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id.toString()">{{ cat.name }}</option>
              }
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Base Price (<i class="bi bi-currency-rupee"></i>)</label>
            <input type="number" formControlName="price" class="input-field py-2" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Discount Price (<i class="bi bi-currency-rupee"></i>)</label>
            <input type="number" formControlName="discountPrice" class="input-field py-2" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Brand</label>
            <input type="text" formControlName="brand" class="input-field py-2" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Short Description</label>
          <input type="text" formControlName="shortDescription" class="input-field py-2" />
        </div>

        <div class="flex flex-wrap gap-6 py-2">
          <div class="flex items-center gap-2">
            <input type="checkbox" id="isPublished" formControlName="isPublished" class="rounded text-primary-500 focus:ring-primary-500 w-4 h-4 cursor-pointer" />
            <label for="isPublished" class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">Publish immediately (visible in shop)</label>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" id="isComboOffer" formControlName="isComboOffer" class="rounded text-primary-500 focus:ring-primary-500 w-4 h-4 cursor-pointer" />
            <label for="isComboOffer" class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">Combo Offer</label>
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

        <!-- Semicolon split tags -->
        <div>
          <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Tags (comma separated)</label>
          <input type="text" formControlName="tagsInput" class="input-field py-2" placeholder="cotton, organic, baby, girls" />
        </div>

        <!-- Add Image files dynamically via drag & drop / multi-upload -->
        <div class="border-t pt-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-xs uppercase tracking-wider text-neutral-400">Product Images</h3>
            @if (uploadingImages()) {
              <span class="text-xs text-neutral-500 flex items-center gap-1.5">
                <svg class="animate-spin h-3.5 w-3.5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            }
          </div>

          <!-- Drag and drop zone -->
          <div
            (click)="fileInput.click()"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            [class.drag-active]="isDragging()"
            class="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 drag-zone"
          >
            <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <div class="text-sm font-semibold text-neutral-700">Drag & drop files here or click to browse</div>
            <div class="text-xs text-neutral-400">Supports JPG, PNG, GIF, WebP (Max 10 files)</div>
            <input
              #fileInput
              type="file"
              multiple
              accept="image/*"
              class="hidden"
              (change)="onFileSelected($event)"
            />
          </div>

          <!-- Thumbnails grid -->
          @if (imagesFormArray.controls.length > 0) {
            <div class="text-xs text-neutral-500 font-semibold mb-1">
              Uploaded Images ({{ imagesFormArray.controls.length }}):
            </div>
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
              @for (imgCtrl of imagesFormArray.controls; track $index) {
                <div class="flex flex-col items-center">
                  <div class="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shadow-sm w-full" style="aspect-ratio: 1/1; min-height: 100px;">
                    <img [src]="imgCtrl.value" class="w-full h-full object-cover" alt="Product image preview" />
                    <button
                      type="button"
                      (click)="removeImageLink($index)"
                      class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-105"
                      title="Remove Image"
                    >
                      <i class="pi pi-times text-[10px]"></i>
                    </button>
                  </div>
                  <div class="text-[9px] text-neutral-400 truncate w-full mt-1 text-center" [title]="imgCtrl.value">
                    {{ imgCtrl.value }}
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Add Variant / Stock fields -->
        <div class="border-t pt-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-xs uppercase tracking-wider text-neutral-400">Product Variants</h3>
            <button type="button" (click)="addVariant()" class="text-xs font-bold hover:underline" style="color: var(--color-primary);">+ Add Variant</button>
          </div>

          <div formArrayName="variants" class="space-y-3">
            @for (vCtrl of variantsFormArray.controls; track $index) {
              <div [formGroupName]="$index" class="grid grid-cols-2 sm:grid-cols-6 gap-3 p-3 border rounded-xl bg-neutral-50/20 relative">
                <div>
                  <label class="text-[10px] block font-bold mb-1">SKU</label>
                  <input type="text" formControlName="sku" class="input-field py-1 text-xs" />
                </div>
                <div>
                  <label class="text-[10px] block font-bold mb-1">Size</label>
                  <input type="text" formControlName="size" class="input-field py-1 text-xs" />
                </div>
                <!-- Image Picker Column -->
                <div class="relative">
                  <label class="text-[10px] block font-bold mb-1">Image</label>
                  <div (click)="toggleImageSelector($index)" 
                       class="w-full h-8 rounded-xl border border-neutral-200 cursor-pointer flex items-center justify-center bg-white overflow-hidden hover:bg-neutral-50 transition-colors">
                    @if (vCtrl.get('imageUrl')?.value; as imgUrl) {
                      <img [src]="imgUrl" class="w-full h-full object-cover" />
                    } @else {
                      <span class="text-neutral-400 text-[10px]"><i class="pi pi-image"></i></span>
                    }
                  </div>
                  
                  <!-- Dropdown Popover -->
                  @if (activeImageSelectorIdx() === $index) {
                    <div class="absolute z-30 left-0 mt-1 p-2 bg-white border border-neutral-200 rounded-xl shadow-xl w-48 space-y-2">
                      <div class="flex items-center justify-between border-b pb-1">
                        <span class="text-[10px] font-bold text-neutral-400">Select Image</span>
                        <button type="button" (click)="activeImageSelectorIdx.set(null)" class="text-neutral-400 hover:text-neutral-600"><i class="pi pi-times text-[10px]"></i></button>
                      </div>
                      
                      @if (productImagesList.length === 0) {
                        <div class="text-[10px] text-neutral-400 py-1 text-center">No images uploaded yet.</div>
                      } @else {
                        <div class="grid grid-cols-4 gap-1.5 max-h-24 overflow-y-auto">
                          @for (img of productImagesList; track img) {
                            <button type="button" 
                                    (click)="selectVariantImage($index, img)"
                                    class="w-8 h-8 rounded-lg overflow-hidden border border-neutral-100 hover:border-primary-500 transition-colors">
                              <img [src]="img" class="w-full h-full object-cover" />
                            </button>
                          }
                        </div>
                      }
                      
                      <div class="border-t pt-1.5 flex justify-end">
                        <button type="button" 
                                (click)="selectVariantImage($index, '')"
                                class="text-[10px] text-red-500 font-bold hover:underline">Clear Image</button>
                      </div>
                    </div>
                    
                    <!-- Backdrop overlay to close when clicking outside -->
                    <div class="fixed inset-0 z-20" (click)="activeImageSelectorIdx.set(null)"></div>
                  }
                </div>
                <div>
                  <label class="text-[10px] block font-bold mb-1">Color Picker</label>
                  <input type="color" formControlName="colorHex" class="w-full h-8 rounded-xl border border-neutral-200 cursor-pointer p-0 bg-transparent overflow-hidden" />
                </div>
                <div>
                  <label class="text-[10px] block font-bold mb-1">Color Name</label>
                  <input type="text" formControlName="color" class="input-field py-1 text-xs" placeholder="e.g. White" />
                </div>
                <div>
                  <label class="text-[10px] block font-bold mb-1">Stock Qty</label>
                  <input type="number" formControlName="stock" class="input-field py-1 text-xs" />
                </div>
                <button type="button" (click)="removeVariant($index)" class="absolute top-1 right-1 text-red-500 text-xs font-bold hover:scale-105 transition-transform" aria-label="Remove variant"><i class="pi pi-times"></i></button>
              </div>
            }
          </div>
        </div>

        <div class="pt-6 border-t border-neutral-100 dark:border-neutral-700 flex justify-end gap-3">
          <a routerLink="/admin/products" class="btn-secondary py-3 px-6 text-xs font-bold">Cancel</a>
          <button type="submit" [disabled]="form.invalid || submitting()" class="btn-primary py-3 px-8 text-xs font-bold">
            {{ editMode() ? 'Update Product' : 'Create Product' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .drag-zone {
      border-color: var(--color-border);
      background: var(--color-bg-subtle);
    }
    .drag-zone:hover, .drag-active {
      border-color: var(--color-primary) !important;
      background: var(--color-primary-light) !important;
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
  submitting = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  uploadingImages = signal<boolean>(false);
  isDragging = signal<boolean>(false);

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

  uiLogs = signal<string[]>([]);

  addUiLog(msg: string) {
    console.log(msg);
    this.uiLogs.update((logs) => [...logs, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    this.cdr.detectChanges();
  }

  clearUiLogs() {
    this.uiLogs.set([]);
    this.cdr.detectChanges();
  }

  activeImageSelectorIdx = signal<number | null>(null);

  get productImagesList(): string[] {
    return (this.imagesFormArray.value || []).filter(Boolean);
  }

  toggleImageSelector(index: number) {
    this.activeImageSelectorIdx.set(this.activeImageSelectorIdx() === index ? null : index);
    this.cdr.detectChanges();
  }

  selectVariantImage(index: number, imgUrl: string) {
    const ctrl = this.variantsFormArray.at(index);
    if (ctrl) {
      ctrl.get('imageUrl')?.setValue(imgUrl);
    }
    this.activeImageSelectorIdx.set(null);
    this.cdr.detectChanges();
  }

  form = this.fb.group({
    title: ['', [Validators.required]],
    sku: [''],
    categoryId: ['', [Validators.required]],
    price: [299, [Validators.required, Validators.min(0)]],
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

  loadProductDetails(id: string) {
    this.addUiLog('[DEBUG] loadProductDetails starting for ID: ' + id);
    this.http.get<any>(`${environment.apiUrl}/products/${id}`).subscribe({
      next: (res) => {
        const prod = res.data;
        this.addUiLog('[DEBUG] Load product details response data keys: ' + Object.keys(prod || {}).join(', '));
        if (!prod) {
          this.addUiLog('[WARN] Product data is empty.');
          return;
        }

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
        this.addUiLog('[DEBUG] Cleared images form array. Current images list: ' + JSON.stringify(prod.images));
        if (prod.images?.length > 0) {
          prod.images.forEach((img: string, idx: number) => {
            this.imagesFormArray.push(this.fb.control(img));
            this.addUiLog(`[DEBUG] Pushed image index ${idx} to FormArray: ${img}`);
          });
        }
        this.addUiLog('[DEBUG] Final images FormArray length: ' + this.imagesFormArray.length);

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
              stock: [v.stock || 0, Validators.required],
            });

            this.setupVariantControl(group);
            this.variantsFormArray.push(group);
          });
        }

        // Handle category selection for Combo Offers
        this.checkAndSetComboOfferState(prod.categoryId);

        this.cdr.detectChanges();
        this.addUiLog('[DEBUG] Completed loadProductDetails and triggered change detection.');
      },
      error: (err) => {
        this.addUiLog('[ERROR] Failed to load product details: ' + JSON.stringify(err));
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
      stock: [10, Validators.required],
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

  addImageLink() {
    this.imagesFormArray.push(this.fb.control(''));
  }

  removeImageLink(index: number) {
    this.imagesFormArray.removeAt(index);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addUiLog(`[DEBUG] onFileSelected event fired: ${input.files.length} file(s) chosen.`);
      this.uploadFiles(input.files);
      input.value = ''; // Clear value to allow selecting same file again
    } else {
      this.addUiLog('[DEBUG] onFileSelected event fired but no files chosen.');
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      this.uploadFiles(event.dataTransfer.files);
    }
  }

  uploadFiles(files: FileList | File[]) {
    if (!files || files.length === 0) {
      this.addUiLog('[WARN] uploadFiles called with empty file list.');
      return;
    }
        this.addUiLog('[DEBUG] uploadFiles started for ' + files.length + ' file(s).');
    this.uploadingImages.set(true);
    this.errorMessage.set('');
    this.cdr.detectChanges();

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
      this.addUiLog(`[DEBUG] Appending file to FormData: ${files[i].name} (${files[i].size} bytes, type: ${files[i].type})`);
    }

    this.http.post<any>(`${environment.apiUrl}/upload/multiple`, formData).subscribe({
      next: (res) => {
        this.addUiLog('[DEBUG] uploadFiles success. Server response: ' + JSON.stringify(res));
        const newUrls: string[] = res.urls || res.data?.urls || (Array.isArray(res.data) ? res.data : []);
        this.addUiLog('[DEBUG] Extracted URLs: ' + JSON.stringify(newUrls));
        newUrls.forEach(url => {
          this.imagesFormArray.push(this.fb.control(url));
          this.addUiLog('[DEBUG] Pushed URL to FormArray: ' + url);
        });
        this.uploadingImages.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addUiLog('[ERROR] uploadFiles failed: ' + JSON.stringify(err));
        this.errorMessage.set('Failed to upload images.');
        this.uploadingImages.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const formVal = this.form.getRawValue();

    // Build payload matching backend schemas
    const payload = {
      title: formVal.title,
      sku: formVal.sku,
      categoryId: formVal.categoryId ? Number(formVal.categoryId) : 0,
      price: Number(formVal.price),
      discountPrice: formVal.discountPrice ? Number(formVal.discountPrice) : undefined,
      brand: formVal.brand,
      shortDescription: formVal.shortDescription,
      description: formVal.description,
      material: formVal.material,
      careInstructions: formVal.careInstructions,
      tags: formVal.tagsInput ? formVal.tagsInput.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      variants: (formVal.variants || []).map((v: any) => ({
        sku: v.sku,
        size: v.size || 'One Size',
        color: v.color || 'Natural',
        colorHex: v.colorHex || '#ede0d4',
        imageUrl: v.imageUrl || null,
        stock: Number(v.stock || 0),
      })),
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
