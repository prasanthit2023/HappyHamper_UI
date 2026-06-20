import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../../../state/auth.store';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'bb-addresses-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card p-6 space-y-6 bg-white border border-[var(--color-border)] rounded-2xl shadow-sm page-enter animate-fade-in">
      <div class="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 class="font-bold text-xl text-[var(--color-text)] font-display">My Addresses</h2>
          <p class="text-[var(--color-text-muted)] text-xs mt-0.5">Manage delivery details for faster checkout</p>
        </div>
        <button
          (click)="openAddForm()"
          class="btn-primary text-xs py-2.5 px-4 font-bold"
        >
          {{ showForm() ? 'Close Form' : '+ Add Address' }}
        </button>
      </div>

      <!-- Address Form (Add / Edit) -->
      @if (showForm()) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="border border-[var(--color-border)] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up bg-[var(--color-bg-subtle)]" novalidate>
          <h3 class="sm:col-span-2 font-bold text-sm text-[var(--color-text)] uppercase tracking-wider mb-2">
            {{ editAddressId() ? 'Edit Address' : 'Add New Address' }}
          </h3>

          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">Full Name *</label>
            <input type="text" formControlName="fullName" class="input-field py-2" placeholder="e.g. Priya Sharma" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">Street Address *</label>
            <input type="text" formControlName="street" class="input-field py-2" placeholder="House no, block, area..." />
          </div>
          <div>
            <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">City *</label>
            <input type="text" formControlName="city" class="input-field py-2" placeholder="e.g. Bengaluru" />
          </div>
          <div>
            <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">State *</label>
            <input type="text" formControlName="state" class="input-field py-2" placeholder="e.g. Karnataka" />
          </div>
          <div>
            <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">Country *</label>
            <input type="text" formControlName="country" class="input-field py-2" />
          </div>
          <div>
            <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">Postal Code *</label>
            <input type="text" formControlName="zipCode" class="input-field py-2" placeholder="6-digit PIN" maxlength="6" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">Phone Number *</label>
            <input type="tel" formControlName="phone" class="input-field py-2" placeholder="+91 98765 43210" />
          </div>
          <div>
            <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">Label (e.g. Home, Work)</label>
            <input type="text" formControlName="label" class="input-field py-2" />
          </div>
          <div class="flex items-center pt-6">
            <label class="flex items-center gap-2 text-sm text-[var(--color-text-muted)] cursor-pointer">
              <input type="checkbox" formControlName="isDefault" class="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4" />
              Set as default address
            </label>
          </div>

          <div class="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button type="button" (click)="showForm.set(false)" class="btn-secondary py-2.5 px-4 text-xs font-bold">Cancel</button>
            <button type="submit" [disabled]="form.invalid || authStore.loading()" class="btn-primary py-2.5 px-5 text-xs font-bold">
              Save Address
            </button>
          </div>
        </form>
      }

      <!-- Saved Addresses Grid -->
      @if (addresses().length === 0) {
        <div class="text-center py-12 text-[var(--color-text-muted)] text-sm">
          You haven't saved any addresses yet. Add one to speed up checkout.
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (addr of addresses(); track (addr.id || addr._id)) {
            <div
              class="group border-2 rounded-2xl p-5 relative space-y-3 bg-white transition-all duration-300 hover:shadow-md hover:border-[var(--color-sandal)]"
              [class]="addr.isDefault
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] bg-opacity-20'
                : 'border-[var(--color-border)]'"
            >
              <div class="flex justify-between items-start">
                <span class="text-[10px] font-bold bg-[var(--color-accent-light)] border border-[var(--color-border)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {{ addr.label || 'Address' }}
                </span>
                @if (addr.isDefault) {
                  <span class="text-[10px] font-bold text-[var(--color-primary)] bg-white border border-[var(--color-primary)] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">Default</span>
                }
              </div>

              <div class="text-sm">
                <p class="font-bold text-[var(--color-text)]">
                  {{ addr.fullName || authStore.fullName() }}
                </p>
                <p class="text-[var(--color-text-muted)] mt-1.5 leading-relaxed text-xs">
                  {{ addr.street }}, {{ addr.city }}, {{ addr.state }}, {{ addr.country }} - {{ addr.zipCode }}
                </p>
                <p class="text-xs text-[var(--color-text-muted)] mt-2 font-bold flex items-center gap-1">
                  <span>📞</span> {{ addr.phone }}
                </p>
              </div>

              <div class="flex items-center gap-3 pt-3 border-t border-[var(--color-border)] text-xs transition-opacity duration-200">
                @if (!addr.isDefault) {
                  <button (click)="setDefault(addr.id || addr._id)" class="text-[var(--color-primary)] font-bold hover:text-[var(--color-primary-dark)] hover:underline flex items-center gap-1">
                    Set Default
                  </button>
                }
                <button (click)="editAddress(addr)" class="text-[var(--color-text-muted)] font-semibold hover:text-[var(--color-text)] hover:underline flex items-center gap-1">
                  Edit
                </button>
                <button (click)="deleteAddress(addr.id || addr._id)" class="text-red-500 font-semibold hover:text-red-700 hover:underline flex items-center gap-1">
                  Delete
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AddressesComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private confirmService = inject(ConfirmService);

  addresses = signal<any[]>([]);
  showForm = signal<boolean>(false);
  editAddressId = signal<string | null>(null);

  form = this.fb.group({
    fullName: ['', [Validators.required]],
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    country: ['India', [Validators.required]],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    phone: ['', [Validators.required]],
    label: ['Home', [Validators.required]],
    isDefault: [false],
  });

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    const user = this.authStore.user();
    if (user && user.addresses) {
      this.addresses.set(user.addresses);
      this.cdr.markForCheck();
    }
  }

  openAddForm() {
    this.editAddressId.set(null);
    this.form.reset({
      fullName: this.authStore.fullName() || '',
      country: 'India',
      label: 'Home',
      isDefault: false,
    });
    this.showForm.set(!this.showForm());
  }

  editAddress(address: any) {
    this.editAddressId.set(address.id || address._id);
    this.form.patchValue({
      fullName: address.fullName || this.authStore.fullName() || '',
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      zipCode: address.zipCode,
      phone: address.phone,
      label: address.label,
      isDefault: address.isDefault,
    });
    this.showForm.set(true);
  }

  setDefault(addressId: string) {
    this.authStore.setDefaultAddress(addressId).subscribe(() => {
      this.loadAddresses();
    });
  }

  deleteAddress(addressId: string) {
    this.confirmService.confirm({
      message: 'Are you sure you want to delete this address?',
      type: 'danger',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.authStore.deleteAddress(addressId).subscribe(() => {
          this.loadAddresses();
        });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    const data = this.form.value;
    const id = this.editAddressId();

    if (id) {
      this.authStore.updateAddress(id, data).subscribe({
        next: () => {
          this.showForm.set(false);
          this.loadAddresses();
        },
      });
    } else {
      this.authStore.addAddress(data).subscribe({
        next: () => {
          this.showForm.set(false);
          this.loadAddresses();
        },
      });
    }
  }
}
