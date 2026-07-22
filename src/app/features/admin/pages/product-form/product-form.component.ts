import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export const discountLessThanPriceValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const price = control.get('price')?.value;
  const discountPrice = control.get('discountPrice')?.value;
  
  if (price !== null && discountPrice !== null && Number(discountPrice) > Number(price)) {
    control.get('discountPrice')?.setErrors({ discountGreaterThanPrice: true });
    return { discountGreaterThanPrice: true };
  }
  
  const errors = control.get('discountPrice')?.errors;
  if (errors && errors['discountGreaterThanPrice']) {
    delete errors['discountGreaterThanPrice'];
    if (Object.keys(errors).length === 0) {
      control.get('discountPrice')?.setErrors(null);
    } else {
      control.get('discountPrice')?.setErrors(errors);
    }
  }
  return null;
};

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
  loadingProduct = signal<boolean>(false);
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
    group.get('color')?.valueChanges.subscribe((colorName) => {
      const colorLower = (colorName || '').trim().toLowerCase();
      const matchedHex = this.colorHexMap[colorLower] || this.colorHexMap[colorLower.split(/\s+/)[0]];
      if (matchedHex) {
        group.get('colorHex')?.setValue(matchedHex, { emitEvent: false });
      }
    });

    group.get('colorHex')?.valueChanges.subscribe((hex) => {
      if (hex) {
        const colorName = this.getColorNameFromHex(hex);
        group.get('color')?.setValue(colorName, { emitEvent: false });
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

  baseNextSkuSerial = 1;
  currentYear = new Date().getFullYear();

  preloadNextSku() {
    this.http.get<any>(`${environment.apiUrl}/products/next-sku`).subscribe({
      next: (res) => {
        if (res.success && res.nextSku) {
          const parts = res.nextSku.split('-');
          if (parts.length >= 3) {
            this.currentYear = Number(parts[1]);
            this.baseNextSkuSerial = Number(parts[2]);
            
            // Update any existing initial variants' SKUs
            this.variantsFormArray.controls.forEach((ctrl, idx) => {
              const serial = this.baseNextSkuSerial + idx;
              const paddedSerial = String(serial).padStart(6, '0');
              ctrl.get('sku')?.setValue(`PR-${this.currentYear}-${paddedSerial}`, { emitEvent: false });
            });
            this.cdr.detectChanges();
          }
        }
      }
    });
  }

  form = this.fb.group({
    title: ['', [Validators.required]],
    categoryId: ['', [Validators.required]],
    brand: ['', [Validators.required]],
    description: ['', [Validators.required]],
    material: ['', [Validators.required]],
    careInstructions: ['', [Validators.required]],
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
    this.preloadNextSku();
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
    this.loadingProduct.set(true);
    this.cdr.detectChanges();

    this.http.get<any>(`${environment.apiUrl}/products/${id}`).subscribe({
      next: (res) => {
        this.loadingProduct.set(false);
        const prod = res.data;
        if (!prod) return;

        this.form.patchValue({
          title: prod.title,
          categoryId: String(prod.categoryId?._id || prod.categoryId?.id || prod.categoryId || ''),
          brand: prod.brand || '',
          description: prod.description || '',
          material: prod.material || '',
          careInstructions: prod.careInstructions || '',
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
              sizeId: [v.sizeId ? String(v.sizeId) : '', Validators.required],
              color: [v.color || '', Validators.required],
              colorHex: [v.colorHex || '#ffffff'],
              imageUrl: [v.imageUrl || ''],
              images: [v.images || (v.imageUrl ? [v.imageUrl] : [])],
              stock: [v.stock || 0, [Validators.required, Validators.min(0)]],
              price: [v.price || null, [Validators.required, Validators.min(0.01)]],
              discountPrice: [v.discountAmount || null],
            }, { validators: [discountLessThanPriceValidator] });

            this.setupVariantControl(group);
            this.variantsFormArray.push(group);
          });
        }

        // Handle category selection for Combo Offers
        this.checkAndSetComboOfferState(prod.categoryId);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingProduct.set(false);
        this.errorMessage.set('Failed to load product details.');
        this.cdr.detectChanges();
      }
    });
  }

  addVariant() {
    const serial = this.baseNextSkuSerial + this.variantsFormArray.length;
    const paddedSerial = String(serial).padStart(6, '0');
    const sku = `PR-${this.currentYear}-${paddedSerial}`;

    const group = this.fb.group({
      sku: [sku],
      sizeId: ['', Validators.required],
      color: ['White', Validators.required],
      colorHex: ['#ffffff'],
      imageUrl: [''],
      images: [[]],
      stock: [10, [Validators.required, Validators.min(0)]],
      price: [null, [Validators.required, Validators.min(0.01)]],
      discountPrice: [null],
    }, { validators: [discountLessThanPriceValidator] });

    this.setupVariantControl(group);
    this.variantsFormArray.push(group);
    
    // Trigger initial values
    const color = group.get('color')?.value || '';
    const colorLower = color.trim().toLowerCase();
    const matchedHex = this.colorHexMap[colorLower] || '#ffffff';
    group.get('colorHex')?.setValue(matchedHex, { emitEvent: false });
  }

  removeVariant(index: number) {
    this.variantsFormArray.removeAt(index);
  }

  onSubmit() {
    if (this.variantsFormArray.length === 0) {
      this.errorMessage.set('Please add at least one product variant.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.variantsFormArray.controls.forEach(c => c.markAllAsTouched());
      this.errorMessage.set('Please correct all validation errors.');
      return;
    }
    
    this.submitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const formVal = this.form.getRawValue();

    const variants = (formVal.variants || []).map((v: any) => ({
      sku: v.sku,
      sizeId: v.sizeId ? Number(v.sizeId) : null,
      color: v.color || 'Natural',
      colorHex: v.colorHex || '#ede0d4',
      imageUrl: v.imageUrl || null,
      images: v.images || [],
      stock: Number(v.stock || 0),
      price: v.price ? Number(v.price) : 0,
      discountPrice: v.discountPrice ? Number(v.discountPrice) : 0
    }));

    // Build payload matching backend schemas
    const payload = {
      title: formVal.title,
      categoryId: formVal.categoryId ? Number(formVal.categoryId) : 0,
      brand: formVal.brand,
      description: formVal.description,
      material: formVal.material,
      careInstructions: formVal.careInstructions,
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
