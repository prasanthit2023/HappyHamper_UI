import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, AbstractControl } from '@angular/forms';
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
    <div class="bb-container py-8 page-enter animate-fade-in">

      <!-- Page Header -->
      <div class="mb-8">
        <nav class="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-3" aria-label="Breadcrumb">
          <a routerLink="/" class="hover:text-[var(--color-primary)] transition-colors font-medium">Home</a>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <a routerLink="/cart" class="hover:text-[var(--color-primary)] transition-colors font-medium">Cart</a>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-[var(--color-text)] font-semibold">Checkout</span>
        </nav>
        <h1 class="text-3xl font-extrabold text-[var(--color-text)] font-display">Checkout</h1>
      </div>

      <!-- Step Indicator -->
      <div class="mb-8 max-w-xl" role="navigation" aria-label="Checkout steps">
        <div class="flex items-center justify-between relative">
          <!-- Step Background Line -->
          <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[var(--color-border)] -z-10 rounded"></div>
          
          <!-- Active Line Overlay -->
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 -z-10 rounded transition-all duration-300"
               [style.width]="currentStep() === 1 ? '0%' : currentStep() === 2 ? '50%' : '100%'"
               [style.background]="'var(--gradient-primary)'">
          </div>

          <!-- Step 1: Address -->
          <div class="flex flex-col items-center">
            <button
              (click)="currentStep.set(1)"
              [disabled]="submitting()"
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all duration-300
                {{ currentStep() >= 1 ? 'text-white' : 'bg-white border-2 border-[var(--color-border)] text-[var(--color-text-muted)]' }}"
              [style]="currentStep() >= 1 ? 'background: var(--gradient-primary)' : ''"
              [attr.aria-current]="currentStep() === 1 ? 'step' : null"
            >
              @if (currentStep() > 1) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              } @else {
                1
              }
            </button>
            <span class="text-xs font-bold mt-2 text-center leading-tight transition-colors duration-300
              {{ currentStep() >= 1 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]' }}">
              Address
            </span>
          </div>

          <!-- Step 2: Payment -->
          <div class="flex flex-col items-center">
            <button
              (click)="navigateToPaymentStep()"
              [disabled]="submitting() || (!selectedAddressId() && addressForm.invalid)"
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all duration-300
                {{ currentStep() >= 2 ? 'text-white' : 'bg-white border-2 border-[var(--color-border)] text-[var(--color-text-muted)]' }}"
              [style]="currentStep() >= 2 ? 'background: var(--gradient-primary)' : ''"
              [attr.aria-current]="currentStep() === 2 ? 'step' : null"
            >
              @if (currentStep() > 2) {
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              } @else {
                2
              }
            </button>
            <span class="text-xs font-bold mt-2 text-center leading-tight transition-colors duration-300
              {{ currentStep() >= 2 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]' }}">
              Payment
            </span>
          </div>

          <!-- Step 3: Review & Confirm -->
          <div class="flex flex-col items-center">
            <button
              (click)="navigateToConfirmStep()"
              [disabled]="submitting() || (!selectedAddressId() && addressForm.invalid)"
              class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all duration-300
                {{ currentStep() >= 3 ? 'text-white' : 'bg-white border-2 border-[var(--color-border)] text-[var(--color-text-muted)]' }}"
              [style]="currentStep() >= 3 ? 'background: var(--gradient-primary)' : ''"
              [attr.aria-current]="currentStep() === 3 ? 'step' : null"
            >
              3
            </button>
            <span class="text-xs font-bold mt-2 text-center leading-tight transition-colors duration-300
              {{ currentStep() >= 3 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]' }}">
              Confirm
            </span>
          </div>
        </div>
      </div>

      @if (cartStore.isEmpty()) {
        <div class="card p-12 text-center text-[var(--color-text-muted)] max-w-md mx-auto space-y-4">
          <svg class="w-16 h-16 mx-auto text-[var(--color-border)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/>
          </svg>
          <h3 class="text-lg font-bold text-[var(--color-text)]">Your cart is empty</h3>
          <p class="text-sm">You must add some items to your cart before checking out.</p>
          <a routerLink="/products" class="btn-primary py-3 px-8 inline-block">Shop Now</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <!-- Left Column: Shipping Address & Payment -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Shipping Address Section -->
            <div class="card p-6 space-y-5" [class.ring-2]="currentStep() === 1" [class.ring-[var(--color-primary)]]="currentStep() === 1" [class.ring-opacity-50]="currentStep() === 1">
              <h2 class="font-bold text-lg text-[var(--color-text)] border-b border-[var(--color-border)] pb-3 flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style="background: var(--gradient-primary)">1</div>
                  <svg class="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Shipping Address
                </span>
                @if (currentStep() > 1) {
                  <button (click)="currentStep.set(1)" class="text-xs text-[var(--color-primary)] hover:underline font-semibold flex items-center gap-1">
                    Edit
                  </button>
                }
              </h2>

              <!-- Saved Addresses List -->
              @if (savedAddresses().length > 0) {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Saved addresses">
                  @for (addr of savedAddresses(); track (addr.id || addr._id)) {
                    <div
                      (click)="selectAddress(addr)"
                      (keydown.enter)="selectAddress(addr)"
                      (keydown.space)="selectAddress(addr)"
                      class="border-2 rounded-2xl p-4 cursor-pointer relative transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      [class]="selectedAddressId() === (addr.id || addr._id) && !showNewAddressForm()
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] bg-opacity-20 shadow-sm'
                        : 'border-[var(--color-border)] hover:border-[var(--color-sandal)] bg-white'"
                      role="radio"
                      [attr.aria-checked]="selectedAddressId() === (addr.id || addr._id) && !showNewAddressForm()"
                      tabindex="0"
                    >
                      <div class="flex justify-between items-start mb-2">
                        <span class="text-[10px] font-bold bg-[var(--color-accent-light)] border border-[var(--color-border)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {{ addr.label || 'Address' }}
                        </span>
                        @if (addr.isDefault) {
                          <span class="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-2 py-0.5 rounded-md">DEFAULT</span>
                        }
                      </div>
                      <p class="text-sm font-bold text-[var(--color-text)]">{{ addr.fullName || authStore.fullName() }}</p>
                      <p class="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                        {{ addr.street }}, {{ addr.city }}, {{ addr.state }}, {{ addr.country }} - {{ addr.zipCode }}
                      </p>
                      <p class="text-xs text-[var(--color-text-muted)] mt-2 font-semibold flex items-center gap-1">
                        <span>📞</span> {{ addr.phone }}
                      </p>

                      @if (selectedAddressId() === (addr.id || addr._id) && !showNewAddressForm()) {
                        <div class="absolute bottom-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white" style="background: var(--color-primary)">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                          </svg>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="pt-2">
                  <button
                    (click)="toggleNewAddressForm()"
                    class="text-sm text-[var(--color-primary)] font-bold hover:text-[var(--color-primary-dark)] inline-flex items-center gap-1.5 transition-colors"
                    [attr.aria-expanded]="showNewAddressForm()"
                  >
                    <svg class="w-4 h-4 transition-transform duration-300" [class.rotate-45]="showNewAddressForm()" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    {{ showNewAddressForm() ? 'Cancel New Address' : 'Add New Address' }}
                  </button>
                </div>
              }

              <!-- New Address Form -->
              @if (showNewAddressForm() || savedAddresses().length === 0) {
                <form [formGroup]="addressForm" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-slide-up" novalidate>

                  <!-- Row 1: Full Name & Phone Number -->
                  <div class="sm:col-span-1">
                    <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5" for="fullName">Full Name *</label>
                    <input
                      id="fullName"
                      type="text"
                      formControlName="fullName"
                      class="input-field py-2"
                      [class.border-red-400]="isInvalid('fullName')"
                      [class.ring-1]="isInvalid('fullName')"
                      [class.ring-red-300]="isInvalid('fullName')"
                      placeholder="e.g. Priya Sharma"
                      aria-required="true"
                      [attr.aria-invalid]="isInvalid('fullName')"
                    />
                    @if (isInvalid('fullName')) {
                      <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Full name is required
                      </p>
                    }
                  </div>

                  <div class="sm:col-span-1">
                    <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5" for="phone">Phone Number *</label>
                    <input
                      id="phone"
                      type="tel"
                      formControlName="phone"
                      class="input-field py-2"
                      [class.border-red-400]="isInvalid('phone')"
                      [class.ring-1]="isInvalid('phone')"
                      [class.ring-red-300]="isInvalid('phone')"
                      placeholder="+91 98765 43210"
                      aria-required="true"
                      [attr.aria-invalid]="isInvalid('phone')"
                    />
                    @if (isInvalid('phone')) {
                      <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Phone number is required
                      </p>
                    }
                  </div>

                  <!-- Row 2: Street Address (Full Width) -->
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5" for="street">Street Address *</label>
                    <input
                      id="street"
                      type="text"
                      formControlName="street"
                      class="input-field py-2"
                      [class.border-red-400]="isInvalid('street')"
                      [class.ring-1]="isInvalid('street')"
                      [class.ring-red-300]="isInvalid('street')"
                      placeholder="House no, block, area, landmark..."
                      aria-required="true"
                      [attr.aria-invalid]="isInvalid('street')"
                    />
                    @if (isInvalid('street')) {
                      <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Street address is required
                      </p>
                    }
                  </div>

                  <!-- Row 3: City & State -->
                  <div class="sm:col-span-1">
                    <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5" for="city">City *</label>
                    <input
                      id="city"
                      type="text"
                      formControlName="city"
                      class="input-field py-2"
                      [class.border-red-400]="isInvalid('city')"
                      [class.ring-1]="isInvalid('city')"
                      [class.ring-red-300]="isInvalid('city')"
                      placeholder="e.g. Mumbai"
                      aria-required="true"
                      [attr.aria-invalid]="isInvalid('city')"
                    />
                    @if (isInvalid('city')) {
                      <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        City is required
                      </p>
                    }
                  </div>

                  <div class="sm:col-span-1">
                    <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5" for="state">State *</label>
                    <input
                      id="state"
                      type="text"
                      formControlName="state"
                      class="input-field py-2"
                      [class.border-red-400]="isInvalid('state')"
                      [class.ring-1]="isInvalid('state')"
                      [class.ring-red-300]="isInvalid('state')"
                      placeholder="e.g. Maharashtra"
                      aria-required="true"
                      [attr.aria-invalid]="isInvalid('state')"
                    />
                    @if (isInvalid('state')) {
                      <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        State is required
                      </p>
                    }
                  </div>

                  <!-- Row 4: Country & Postal Code -->
                  <div class="sm:col-span-1">
                    <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5" for="country">Country *</label>
                    <input
                      id="country"
                      type="text"
                      formControlName="country"
                      class="input-field py-2"
                      [class.border-red-400]="isInvalid('country')"
                      [class.ring-1]="isInvalid('country')"
                      [class.ring-red-300]="isInvalid('country')"
                      aria-required="true"
                      [attr.aria-invalid]="isInvalid('country')"
                    />
                    @if (isInvalid('country')) {
                      <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Country is required
                      </p>
                    }
                  </div>

                  <div class="sm:col-span-1">
                    <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5" for="zipCode">Postal Code *</label>
                    <input
                      id="zipCode"
                      type="text"
                      formControlName="zipCode"
                      class="input-field py-2"
                      [class.border-red-400]="isInvalid('zipCode')"
                      [class.ring-1]="isInvalid('zipCode')"
                      [class.ring-red-300]="isInvalid('zipCode')"
                      placeholder="6-digit PIN"
                      maxlength="6"
                      aria-required="true"
                      [attr.aria-invalid]="isInvalid('zipCode')"
                    />
                    @if (isInvalid('zipCode')) {
                      <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Enter a valid 6-digit PIN code
                      </p>
                    }
                  </div>

                  <!-- Row 5: Address Label & Default Checkbox -->
                  <div class="sm:col-span-1">
                    <label class="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5" for="label">Address Label</label>
                    <input
                      id="label"
                      type="text"
                      formControlName="label"
                      placeholder="Home, Office, etc."
                      class="input-field py-2"
                    />
                  </div>

                  <div class="sm:col-span-1 flex items-center pt-6">
                    <label class="flex items-center gap-2.5 text-sm text-[var(--color-text-muted)] cursor-pointer">
                      <input type="checkbox" formControlName="isDefault" class="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4" />
                      Set as default shipping address
                    </label>
                  </div>
                </form>
              }
            </div>

            <!-- Payment Method Section -->
            <div class="card p-6 space-y-5" [class.ring-2]="currentStep() === 2" [class.ring-[var(--color-primary)]]="currentStep() === 2" [class.ring-opacity-50]="currentStep() === 2">
              <h2 class="font-bold text-lg text-[var(--color-text)] border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style="background: var(--gradient-primary)">2</div>
                <svg class="w-5 h-5 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                Payment Method
              </h2>

              <div class="grid grid-cols-1 gap-4" role="radiogroup" aria-label="Payment methods">

                <!-- Razorpay option -->
                <div
                  (click)="selectedPayment.set('razorpay'); currentStep.set(2);"
                  (keydown.enter)="selectedPayment.set('razorpay'); currentStep.set(2);"
                  (keydown.space)="selectedPayment.set('razorpay'); currentStep.set(2);"
                  class="border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  [class]="selectedPayment() === 'razorpay'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] bg-opacity-20 shadow-sm'
                    : 'border-[var(--color-border)] hover:border-[var(--color-sandal)] bg-white'"
                  role="radio"
                  [attr.aria-checked]="selectedPayment() === 'razorpay'"
                  tabindex="0"
                  aria-label="Online payment via Razorpay option"
                >
                  <div class="flex items-center justify-between mb-2">
                    <!-- Online Payment Icon -->
                    <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                    </div>
                    @if (selectedPayment() === 'razorpay') {
                      <div class="w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0" style="background: var(--color-primary)">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    }
                  </div>
                  <p class="font-bold text-sm text-[var(--color-text)]">Online Payment</p>
                  <p class="text-xs text-[var(--color-text-muted)] mt-0.5 font-medium">UPI, Card, Net Banking via Razorpay</p>
                  <!-- UPI / Card icons row -->
                  <div class="flex gap-1.5 mt-3 flex-wrap">
                    <span class="text-[9px] bg-white border border-[var(--color-border)] rounded px-2 py-0.5 font-bold text-[var(--color-text-muted)]">UPI</span>
                    <span class="text-[9px] bg-white border border-[var(--color-border)] rounded px-2 py-0.5 font-bold text-[var(--color-text-muted)]">VISA</span>
                    <span class="text-[9px] bg-white border border-[var(--color-border)] rounded px-2 py-0.5 font-bold text-[var(--color-text-muted)]">MASTERCARD</span>
                    <span class="text-[9px] bg-white border border-[var(--color-border)] rounded px-2 py-0.5 font-bold text-[var(--color-text-muted)]">NETBANKING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Order Summary & Placement -->
          <div class="space-y-4 lg:sticky lg:top-8 lg:h-fit">
            <div class="card p-6 space-y-4" [class.ring-2]="currentStep() === 3" [class.ring-[var(--color-primary)]]="currentStep() === 3" [class.ring-opacity-50]="currentStep() === 3">
              <h2 class="font-bold text-lg text-[var(--color-text)] border-b border-[var(--color-border)] pb-3 flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style="background: var(--gradient-primary)">3</div>
                Review Order
              </h2>

              <!-- Items List -->
              <div class="divide-y divide-[var(--color-border)] max-h-56 overflow-y-auto scrollbar-hide" role="list">
                @for (item of cartStore.cart().items; track item.variantSku) {
                  <div class="flex items-center gap-3 py-3" role="listitem">
                    <div class="relative flex-shrink-0">
                      <img
                        [src]="item.image || '/assets/placeholder-product.jpg'"
                        [alt]="item.title"
                        class="w-12 h-12 object-cover rounded-xl bg-[var(--color-bg-subtle)]"
                        loading="lazy"
                      />
                      <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style="background: var(--color-primary)">
                        {{ item.quantity }}
                      </span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-bold text-[var(--color-text)] truncate">{{ item.title }}</p>
                      <p class="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-medium">
                        @if (item.size) { Size: {{ item.size }} }
                        @if (item.color) { &bull; {{ item.color }} }
                      </p>
                    </div>
                    <span class="text-xs font-bold text-[var(--color-text)] whitespace-nowrap">₹{{ (item.price * item.quantity) | number:'1.0-0' }}</span>
                  </div>
                }
              </div>

              <!-- Price breakdowns -->
              <div class="border-t border-[var(--color-border)] pt-3 space-y-2 text-xs">
                <div class="flex justify-between text-[var(--color-text-muted)]">
                  <span>Subtotal</span>
                  <span class="font-semibold text-[var(--color-text)]">₹{{ cartStore.subTotal() | number:'1.0-0' }}</span>
                </div>

                @if (cartStore.cart().discountAmount > 0) {
                  <div class="flex justify-between text-green-600 font-semibold">
                    <span class="flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                      Promo Applied
                    </span>
                    <span>-₹{{ cartStore.cart().discountAmount | number:'1.0-0' }}</span>
                  </div>
                }

                <div class="flex justify-between text-[var(--color-text-muted)]">
                  <span>Shipping</span>
                  @if (cartStore.subTotal() >= cartStore.freeShippingThreshold) {
                    <span class="font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">FREE</span>
                  } @else {
                    <span class="font-semibold text-[var(--color-text)]">₹49</span>
                  }
                </div>

                <div class="flex justify-between text-[var(--color-text-muted)]">
                  <span>GST (5%)</span>
                  <span class="font-semibold text-[var(--color-text)]">₹{{ (cartStore.subTotal() * 0.05) | number:'1.0-0' }}</span>
                </div>
              </div>

              <!-- Total price -->
              <div class="border-t border-[var(--color-border)] pt-3 flex justify-between items-baseline">
                <span class="font-bold text-sm text-[var(--color-text)]">Order Total</span>
                <span class="text-xl font-extrabold" style="color: var(--color-primary)">
                  ₹{{ grandTotal() | number:'1.0-0' }}
                </span>
              </div>

              <!-- Error message -->
              @if (errorMessage()) {
                <div class="bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-xl text-xs flex items-start gap-2" role="alert">
                  <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ errorMessage() }}
                </div>
              }

              <!-- Submit button with loading state -->
              <button
                (click)="onSubmitOrder()"
                [disabled]="submitting() || (!selectedAddressId() && addressForm.invalid)"
                class="btn-primary w-full py-4 text-sm font-bold mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Place order"
                [attr.aria-busy]="submitting()"
              >
                @if (submitting()) {
                  <!-- Spinner -->
                  <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Processing Order...
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Place Order
                }
              </button>

              <!-- Security Badge -->
              <div class="flex items-center justify-center gap-2 pt-1">
                <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <span class="text-xs text-[var(--color-text-muted)] font-semibold">🔒 SSL Secured Checkout</span>
              </div>

              <!-- Mini trust badges -->
              <div class="flex justify-around pt-3 border-t border-[var(--color-border)] text-[var(--color-text-muted)]">
                <div class="text-center">
                  <p class="text-[10px] font-bold">🚚 Free Delivery</p>
                  <p class="text-[9px] mt-0.5">on orders ₹499+</p>
                </div>
                <div class="text-center font-bold">
                  <p class="text-[10px]">↩️ Easy Returns</p>
                  <p class="text-[9px] mt-0.5">7 days policy</p>
                </div>
              </div>
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
  selectedPayment = signal<string>('razorpay');
  showNewAddressForm = signal<boolean>(false);
  submitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  /** Visual step indicator: 1=address, 2=payment, 3=confirm */
  currentStep = signal<number>(1);

  /** Grand total including shipping and GST */
  grandTotal = computed(() => {
    const sub = this.cartStore.subTotal();
    const discount = this.cartStore.cart().discountAmount ?? 0;
    const shipping = sub >= this.cartStore.freeShippingThreshold ? 0 : 49;
    const gst = sub * 0.05;
    return sub - discount + shipping + gst;
  });

  addressForm = this.fb.group({
    fullName: ['', [Validators.required]],
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    country: ['India', [Validators.required]],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    phone: ['', [Validators.required]],
    label: ['Home'],
    isDefault: [false],
  });

  ngOnInit() {
    this.loadUserAddresses();
  }

  /** Helper: returns true if a control is invalid and touched */
  isInvalid(controlName: string): boolean {
    const ctrl: AbstractControl | null = this.addressForm.get(controlName);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  loadUserAddresses() {
    const user = this.authStore.user();
    if (user && user.addresses) {
      this.savedAddresses.set(user.addresses);
      const def = user.addresses.find((a: any) => a.isDefault);
      if (def) {
        this.selectedAddressId.set(def._id || def.id);
        this.currentStep.set(2);
      } else if (user.addresses.length > 0) {
        this.selectedAddressId.set(user.addresses[0]._id || user.addresses[0].id);
        this.currentStep.set(2);
      } else {
        this.currentStep.set(1);
      }
    } else {
      this.currentStep.set(1);
    }
  }

  selectAddress(addr: any) {
    const id = addr.id || addr._id;
    this.selectedAddressId.set(id);
    this.showNewAddressForm.set(false);
    this.currentStep.set(2);
    this.cdr.markForCheck();
  }

  toggleNewAddressForm() {
    const nextVal = !this.showNewAddressForm();
    this.showNewAddressForm.set(nextVal);
    if (nextVal) {
      this.currentStep.set(1);
    } else {
      this.currentStep.set(this.selectedAddressId() ? 2 : 1);
    }
    this.cdr.markForCheck();
  }

  navigateToPaymentStep() {
    if (this.savedAddresses().length === 0 || this.showNewAddressForm()) {
      if (this.addressForm.invalid) {
        this.addressForm.markAllAsTouched();
        return;
      }
    }
    this.currentStep.set(2);
  }

  navigateToConfirmStep() {
    if (this.savedAddresses().length === 0 || this.showNewAddressForm()) {
      if (this.addressForm.invalid) {
        this.addressForm.markAllAsTouched();
        this.currentStep.set(1);
        return;
      }
    }
    this.currentStep.set(3);
  }

  onSubmitOrder() {
    this.errorMessage.set('');
    this.submitting.set(true);
    this.currentStep.set(3);

    if (this.savedAddresses().length === 0 || this.showNewAddressForm()) {
      if (this.addressForm.invalid) {
        this.addressForm.markAllAsTouched();
        this.submitting.set(false);
        this.currentStep.set(1);
        this.cdr.markForCheck();
        return;
      }

      const addressData = this.addressForm.value;
      this.authStore.addAddress(addressData).subscribe({
        next: (res: any) => {
          if (!res) {
            this.submitting.set(false);
            this.errorMessage.set('Failed to save address. Please try again.');
            this.currentStep.set(1);
            this.cdr.markForCheck();
            return;
          }
          this.loadUserAddresses();
          const latestAddresses = res.data || [];
          const newAddr = latestAddresses[latestAddresses.length - 1];
          if (!newAddr) {
            this.submitting.set(false);
            this.errorMessage.set('Could not retrieve new address. Please try again.');
            this.currentStep.set(1);
            this.cdr.markForCheck();
            return;
          }
          this.placeOrder(newAddr);
        },
        error: (err) => {
          this.submitting.set(false);
          this.currentStep.set(1);
          this.errorMessage.set(err.error?.message || 'Failed to save address details.');
          this.cdr.markForCheck();
        },
      });
    } else {
      const addr = this.savedAddresses().find(
        (a) => a._id === this.selectedAddressId() || a.id === this.selectedAddressId()
      );
      if (!addr) {
        this.submitting.set(false);
        this.currentStep.set(1);
        this.errorMessage.set('Please select or fill a shipping address.');
        this.cdr.markForCheck();
        return;
      }
      this.placeOrder(addr);
    }
  }

  private placeOrder(shippingAddress: any) {
    const payload = {
      shippingAddress: {
        fullName: shippingAddress.fullName || this.authStore.fullName() || 'Customer',
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
        this.router.navigate(['/checkout/success'], { queryParams: { orderId: res.data?.id || res.data?._id, orderNumber: res.data?.orderNumber } });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        this.currentStep.set(2);
        this.errorMessage.set(err.error?.message || 'Order placement failed. Please check item stock and try again.');
        this.cdr.markForCheck();
      },
    });
  }
}
