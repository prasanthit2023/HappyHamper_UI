import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthStore } from '../../../../state/auth.store';
import { CartStore } from '../../../../state/cart.store';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="bb-container py-10 page-enter">
      <h1 class="text-3xl font-extrabold text-neutral-900 dark:text-white font-display mb-8">Checkout</h1>

      @if (cartStore.isEmpty()) {
        <div class="card p-12 text-center text-neutral-400 max-w-md mx-auto space-y-4">
          <h3 class="text-lg font-bold">Your cart is empty</h3>
          <p class="text-sm">You must add some items to your cart before checking out.</p>
          <a routerLink="/products" class="btn-primary py-3 px-8 inline-block">Shop Now</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Shipping Address & Payment -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Shipping Address Section -->
            <div class="card p-6 space-y-4">
              <h2 class="font-bold text-lg text-neutral-900 dark:text-white border-b pb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Shipping Address
              </h2>

              <!-- Saved Addresses List -->
              @if (savedAddresses().length > 0) {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  @for (addr of savedAddresses(); track addr._id) {
                    <div
                      (click)="selectedAddressId.set(addr._id)"
                      [class.border-primary-500]="selectedAddressId() === addr._id"
                      [class.bg-primary-50]="selectedAddressId() === addr._id"
                      [class.border-neutral-200]="selectedAddressId() !== addr._id"
                      class="border-2 rounded-2xl p-4 cursor-pointer relative hover:border-neutral-400 transition-colors"
                    >
                      <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded uppercase tracking-wider">
                          {{ addr.label || 'Address' }}
                        </span>
                        @if (addr.isDefault) {
                          <span class="text-[10px] font-bold text-emerald-600">DEFAULT</span>
                        }
                      </div>
                      <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{{ authStore.fullName() }}</p>
                      <p class="text-xs text-neutral-500 mt-1 leading-relaxed">
                        {{ addr.street }}, {{ addr.city }}, {{ addr.state }}, {{ addr.country }} - {{ addr.zipCode }}
                      </p>
                      <p class="text-xs text-neutral-400 mt-2 font-medium">Phone: {{ addr.phone }}</p>

                      @if (selectedAddressId() === addr._id) {
                        <div class="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-white">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="pt-2">
                  <button
                    (click)="showNewAddressForm.set(!showNewAddressForm())"
                    class="text-sm text-primary-500 font-semibold hover:text-primary-600 inline-flex items-center gap-1"
                  >
                    {{ showNewAddressForm() ? 'Hide Address Form' : '+ Add New Address' }}
                  </button>
                </div>
              }

              <!-- New Address Form -->
              @if (showNewAddressForm() || savedAddresses().length === 0) {
                <form [formGroup]="addressForm" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                    <input type="text" formControlName="street" class="input-field py-2" placeholder="House no, block, area..." />
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
                    <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Address Label</label>
                    <input type="text" formControlName="label" placeholder="Home, Office, etc." class="input-field py-2" />
                  </div>
                  <div class="flex items-center pt-6">
                    <label class="flex items-center gap-2 text-sm text-neutral-500 cursor-pointer">
                      <input type="checkbox" formControlName="isDefault" class="rounded text-primary-500 focus:ring-primary-500" />
                      Set as default shipping address
                    </label>
                  </div>
                </form>
              }
            </div>

            <!-- Payment Method Section -->
            <div class="card p-6 space-y-4">
              <h2 class="font-bold text-lg text-neutral-900 dark:text-white border-b pb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                Payment Method
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- COD option -->
                <div
                  (click)="selectedPayment.set('cod')"
                  [class.border-primary-500]="selectedPayment() === 'cod'"
                  [class.bg-primary-50]="selectedPayment() === 'cod'"
                  [class.border-neutral-200]="selectedPayment() !== 'cod'"
                  class="border-2 rounded-2xl p-4 cursor-pointer text-center hover:border-neutral-400 transition-colors"
                >
                  <p class="font-bold text-sm text-neutral-800 dark:text-neutral-200">Cash on Delivery</p>
                  <p class="text-xs text-neutral-400 mt-1">Pay with cash upon delivery</p>
                </div>

                <!-- Razorpay option -->
                <div
                  (click)="selectedPayment.set('razorpay')"
                  [class.border-primary-500]="selectedPayment() === 'razorpay'"
                  [class.bg-primary-50]="selectedPayment() === 'razorpay'"
                  [class.border-neutral-200]="selectedPayment() !== 'razorpay'"
                  class="border-2 rounded-2xl p-4 cursor-pointer text-center hover:border-neutral-400 transition-colors"
                >
                  <p class="font-bold text-sm text-neutral-800 dark:text-neutral-200">Online Payment</p>
                  <p class="text-xs text-neutral-400 mt-1">Pay securely via Razorpay (UPI, Card, Net Banking)</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Order Summary & Placement -->
          <div class="space-y-6">
            <div class="card p-6 space-y-4">
              <h2 class="font-bold text-lg text-neutral-900 dark:text-white border-b pb-3">Review Order</h2>

              <!-- Items List -->
              <div class="divide-y divide-neutral-100 max-h-60 overflow-y-auto scrollbar-hide">
                @for (item of cartStore.cart().items; track item.variantSku) {
                  <div class="flex items-center gap-3 py-3">
                    <img [src]="item.image || '/assets/placeholder-product.jpg'" class="w-12 h-12 object-cover rounded-lg bg-neutral-50 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">{{ item.title }}</p>
                      <p class="text-[10px] text-neutral-400">Qty: {{ item.quantity }} @if (item.size) { | Size: {{ item.size }} }</p>
                    </div>
                    <span class="text-xs font-semibold text-neutral-900 dark:text-white">₹{{ (item.price * item.quantity) | number:'1.0-0' }}</span>
                  </div>
                }
              </div>

              <!-- Price breakdowns -->
              <div class="border-t pt-3 space-y-2 text-xs">
                <div class="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span class="font-semibold text-neutral-800 dark:text-neutral-200">₹{{ cartStore.subTotal() | number:'1.0-0' }}</span>
                </div>
                @if (cartStore.cart().discountAmount > 0) {
                  <div class="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span class="font-semibold">-₹{{ cartStore.cart().discountAmount | number:'1.0-0' }}</span>
                  </div>
                }
                <div class="flex justify-between text-neutral-500">
                  <span>Shipping</span>
                  @if (cartStore.subTotal() >= cartStore.freeShippingThreshold) {
                    <span class="font-semibold text-emerald-600">FREE</span>
                  } @else {
                    <span class="font-semibold text-neutral-800 dark:text-neutral-200">₹49</span>
                  }
                </div>
              </div>

              <!-- Total price -->
              <div class="border-t pt-3 flex justify-between items-baseline">
                <span class="font-bold text-sm text-neutral-700 dark:text-neutral-300">Order Total</span>
                <span class="text-xl font-extrabold text-primary-600">
                  ₹{{ (cartStore.totalAmount() + (cartStore.subTotal() >= cartStore.freeShippingThreshold ? 0 : 49)) | number:'1.0-0' }}
                </span>
              </div>

              @if (errorMessage()) {
                <div class="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs">
                  {{ errorMessage() }}
                </div>
              }

              <!-- Submit button -->
              <button
                (click)="onSubmitOrder()"
                [disabled]="submitting() || (!selectedAddressId() && addressForm.invalid)"
                class="btn-primary w-full py-4 text-sm font-bold shadow-pink mt-2"
              >
                @if (submitting()) {
                  Processing Order...
                } @else {
                  Place Order
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly cartStore = inject(CartStore);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  savedAddresses = signal<any[]>([]);
  selectedAddressId = signal<string | null>(null);
  selectedPayment = signal<string>('cod');
  showNewAddressForm = signal<boolean>(false);
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  addressForm = this.fb.group({
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
    this.loadUserAddresses();
  }

  loadUserAddresses() {
    const user = this.authStore.user();
    if (user && user.addresses) {
      this.savedAddresses.set(user.addresses);
      const def = user.addresses.find((a) => a.isDefault);
      if (def) {
        this.selectedAddressId.set(def._id || def.id);
      } else if (user.addresses.length > 0) {
        this.selectedAddressId.set(user.addresses[0]._id || user.addresses[0].id);
      }
    }
  }

  onSubmitOrder() {
    this.errorMessage.set('');
    this.submitting.set(true);

    if (this.savedAddresses().length === 0 || this.showNewAddressForm()) {
      // First save/add the new address on the user profile
      if (this.addressForm.invalid) {
        this.addressForm.markAllAsTouched();
        this.submitting.set(false);
        return;
      }

      const addressData = this.addressForm.value;
      this.authStore.addAddress(addressData).subscribe({
        next: (res: any) => {
          this.loadUserAddresses();
          // Find the newly added address ID
          const latestAddresses = res.data || [];
          const newAddr = latestAddresses[latestAddresses.length - 1];
          const newAddrId = newAddr?._id || newAddr?.id;

          this.placeOrder(newAddr);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to save address details.');
          this.cdr.markForCheck();
        },
      });
    } else {
      // Find selected shipping address
      const addr = this.savedAddresses().find((a) => a._id === this.selectedAddressId() || a.id === this.selectedAddressId());
      if (!addr) {
        this.submitting.set(false);
        this.errorMessage.set('Please select or fill a shipping address.');
        return;
      }
      this.placeOrder(addr);
    }
  }

  private placeOrder(shippingAddress: any) {
    const payload = {
      shippingAddress: {
        firstName: shippingAddress.firstName || this.authStore.user()?.firstName || 'Customer',
        lastName: shippingAddress.lastName || this.authStore.user()?.lastName || '',
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        zipCode: shippingAddress.zipCode,
      },
      paymentMethod: this.selectedPayment(),
      notes: 'Order placed from web checkout',
    };

    this.http.post<any>(`${environment.apiUrl}/orders`, payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.cartStore.clearCart();
        this.router.navigate(['/checkout/success'], { queryParams: { orderNumber: res.data?.orderNumber } });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'Order placement failed. Check items stock.');
        this.cdr.markForCheck();
      },
    });
  }
}
