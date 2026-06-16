import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'bb-addresses-manager',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card p-6 space-y-6 page-enter">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">My Addresses</h2>
          <p class="text-neutral-500 text-xs mt-1">Manage delivery details for faster checkout</p>
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
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="border-2 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-down bg-neutral-50/50 dark:bg-neutral-800/10">
          <h3 class="sm:col-span-2 font-bold text-sm text-neutral-800 dark:text-white uppercase tracking-wider mb-2">
            {{ editAddressId() ? 'Edit Address' : 'Add New Address' }}
          </h3>

          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">First Name</label>
            <input type="text" formControlName="firstName" class="input-field py-2" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Last Name</label>
            <input type="text" formControlName="lastName" class="input-field py-2" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Street Address</label>
            <input type="text" formControlName="street" class="input-field py-2" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">City</label>
            <input type="text" formControlName="city" class="input-field py-2" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">State</label>
            <input type="text" formControlName="state" class="input-field py-2" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Country</label>
            <input type="text" formControlName="country" class="input-field py-2" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Postal Code</label>
            <input type="text" formControlName="zipCode" class="input-field py-2" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Phone Number</label>
            <input type="tel" formControlName="phone" class="input-field py-2" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Label (e.g. Home, Work)</label>
            <input type="text" formControlName="label" class="input-field py-2" />
          </div>
          <div class="flex items-center pt-6">
            <label class="flex items-center gap-2 text-sm text-neutral-500 cursor-pointer">
              <input type="checkbox" formControlName="isDefault" class="rounded text-primary-500 focus:ring-primary-500" />
              Set as default address
            </label>
          </div>

          <div class="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
            <button type="button" (click)="showForm.set(false)" class="btn-secondary py-2.5 px-4 text-xs font-bold">Cancel</button>
            <button type="submit" [disabled]="form.invalid || authStore.loading()" class="btn-primary py-2.5 px-5 text-xs font-bold">
              Save Address
            </button>
          </div>
        </form>
      }

      <!-- Saved Addresses Grid -->
      @if (addresses().length === 0) {
        <div class="text-center py-12 text-neutral-400 text-sm">
          You haven't saved any addresses yet. Add one to speed up checkout.
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (addr of addresses(); track addr.id) {
            <div
              [class.border-primary-500]="addr.isDefault"
              [class.border-neutral-200]="!addr.isDefault"
              class="border-2 rounded-2xl p-5 relative space-y-3 bg-white dark:bg-neutral-800"
            >
              <div class="flex justify-between items-start">
                <span class="text-xs font-bold bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded uppercase tracking-wider">
                  {{ addr.label || 'Address' }}
                </span>
                @if (addr.isDefault) {
                  <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Default</span>
                }
              </div>

              <div class="text-sm">
                <p class="font-bold text-neutral-800 dark:text-neutral-100">
                  {{ addr.firstName || authStore.user()?.firstName }} {{ addr.lastName || authStore.user()?.lastName }}
                </p>
                <p class="text-neutral-500 mt-1 leading-relaxed">
                  {{ addr.street }}, {{ addr.city }}, {{ addr.state }}, {{ addr.country }} - {{ addr.zipCode }}
                </p>
                <p class="text-xs text-neutral-400 mt-2">Phone: {{ addr.phone }}</p>
              </div>

              <div class="flex items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 text-xs">
                @if (!addr.isDefault) {
                  <button (click)="setDefault(addr.id)" class="text-primary-500 font-semibold hover:underline">Set Default</button>
                }
                <button (click)="editAddress(addr)" class="text-neutral-600 dark:text-neutral-400 font-semibold hover:underline">Edit</button>
                <button (click)="deleteAddress(addr.id)" class="text-red-500 font-semibold hover:underline">Delete</button>
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

  addresses = signal<any[]>([]);
  showForm = signal<boolean>(false);
  editAddressId = signal<string | null>(null);

  form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
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
      firstName: this.authStore.user()?.firstName || '',
      lastName: this.authStore.user()?.lastName || '',
      country: 'India',
      label: 'Home',
      isDefault: false,
    });
    this.showForm.set(!this.showForm());
  }

  editAddress(address: any) {
    this.editAddressId.set(address.id);
    this.form.patchValue({
      firstName: address.firstName || this.authStore.user()?.firstName || '',
      lastName: address.lastName || this.authStore.user()?.lastName || '',
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
    if (confirm('Are you sure you want to delete this address?')) {
      this.authStore.deleteAddress(addressId).subscribe(() => {
        this.loadAddresses();
      });
    }
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
