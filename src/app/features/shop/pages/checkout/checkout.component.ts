import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
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
  <style>
    .checkout-page { background: linear-gradient(135deg,#f8f4ff 0%,#fef9f0 50%,#f0f9ff 100%); min-height: 100vh; }
    .step-line { transition: width .5s cubic-bezier(.4,0,.2,1); }
    .pay-card { background: linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#6366f1 100%); }
    .upi-badge  { background: linear-gradient(135deg,#1a73e8,#0d47a1); }
    .card-badge { background: linear-gradient(135deg,#eb5757,#c62828); }
    .nb-badge   { background: linear-gradient(135deg,#2e7d32,#1b5e20); }
    .wallet-badge { background: linear-gradient(135deg,#f57c00,#e65100); }
    .secure-banner { background: linear-gradient(90deg,#065f46,#047857); }
    .processing-overlay { position:fixed;inset:0;z-index:9999;background:rgba(15,15,30,.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center; }
    .amount-pulse { animation: amountPulse 2s ease-in-out infinite; }
    @keyframes amountPulse { 0%,100%{text-shadow:0 0 0 transparent} 50%{text-shadow:0 0 20px rgba(124,58,237,.4)} }
    .card-float { animation: cardFloat 3s ease-in-out infinite; }
    @keyframes cardFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
    .shimmer { background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .method-radio:checked + label { border-color:#7c3aed; background:linear-gradient(135deg,rgba(124,58,237,.08),rgba(99,102,241,.05)); box-shadow:0 0 0 3px rgba(124,58,237,.15); }
    .form-field { transition: border-color .2s, box-shadow .2s; }
    .form-field:focus { border-color:#7c3aed; box-shadow:0 0 0 3px rgba(124,58,237,.15); outline:none; }
    .address-card-selected { border-color:#7c3aed !important; background:linear-gradient(135deg,rgba(124,58,237,.06),rgba(99,102,241,.04)) !important; box-shadow:0 4px 20px rgba(124,58,237,.15) !important; }
    .place-btn { background: linear-gradient(135deg,#7c3aed,#6366f1); transition: all .3s cubic-bezier(.4,0,.2,1); }
    .place-btn:hover:not(:disabled) { background:linear-gradient(135deg,#6d28d9,#4f46e5); transform:translateY(-1px); box-shadow:0 8px 25px rgba(124,58,237,.4); }
    .place-btn:active:not(:disabled) { transform:translateY(0); }
    .trust-row { background:linear-gradient(90deg,rgba(124,58,237,.04),rgba(99,102,241,.04)); border:1px solid rgba(124,58,237,.1); }
    .step-btn { transition: all .35s cubic-bezier(.4,0,.2,1); }
    .address-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
    @media (min-width: 640px) { .address-grid { grid-template-columns: repeat(2, 1fr); } }
  </style>

  @if (submitting() && paymentStep()) {
    <!-- Processing Overlay -->
    <div class="processing-overlay" role="status" aria-live="polite" aria-label="Processing payment">
      <div style="background:rgba(255,255,255,.97);border-radius:24px;padding:40px 48px;max-width:380px;width:90%;text-align:center;box-shadow:0 32px 80px rgba(0,0,0,.25)">
        <!-- Animated lock icon -->
        <div style="width:72px;height:72px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 12px 32px rgba(124,58,237,.4)" class="card-float">
          <svg style="width:32px;height:32px;color:#fff" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h3 style="font-size:20px;font-weight:800;color:#1a1a2e;margin-bottom:8px">{{ paymentStep() }}</h3>
        <p style="font-size:13px;color:#6b7280;margin-bottom:24px">Please do not close or refresh this page</p>
        <!-- Animated progress dots -->
        <div style="display:flex;justify-content:center;gap:8px">
          @for (i of [1,2,3]; track i) {
            <div style="width:10px;height:10px;border-radius:50%;background:#7c3aed;animation:dotBounce 1.2s ease-in-out infinite"
                 [style.animation-delay]="(i-1)*0.2 + 's'"></div>
          }
        </div>
        <style>@keyframes dotBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-8px);opacity:1} }</style>
        <!-- Security note -->
        <div style="margin-top:20px;padding:10px 16px;background:#f0fdf4;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:8px">
          <svg style="width:14px;height:14px;color:#16a34a;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span style="font-size:12px;color:#15803d;font-weight:600">256-bit SSL Encrypted | PCI DSS Compliant</span>
        </div>
      </div>
    </div>
  }

  <div class="checkout-page">
    <div class="bb-container py-6 md:py-10">

      <!-- Page Header -->
      <div style="margin-bottom:28px">
        <nav style="display:flex;align-items:center;gap:8px;font-size:12px;color:#9ca3af;margin-bottom:10px" aria-label="Breadcrumb">
          <a routerLink="/" style="color:#9ca3af;font-weight:600;text-decoration:none" class="hover:text-[var(--color-primary)]">Home</a>
          <svg style="width:12px;height:12px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <a routerLink="/cart" style="color:#9ca3af;font-weight:600;text-decoration:none" class="hover:text-[var(--color-primary)]">Cart</a>
          <svg style="width:12px;height:12px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <span style="color:#374151;font-weight:700">Secure Checkout</span>
        </nav>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(124,58,237,.35)">
            <svg style="width:20px;height:20px;color:#fff" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <h1 style="font-size:26px;font-weight:900;color:#1a1a2e;margin:0">Secure Checkout</h1>
            <p style="font-size:12px;color:#6b7280;margin:2px 0 0">Your payment is encrypted and secure</p>
          </div>
        </div>
      </div>

      <!-- Step Progress Bar -->
      <div style="margin-bottom:32px" role="navigation" aria-label="Checkout steps">
        <div style="display:flex;align-items:center;position:relative;max-width:500px">
          <!-- Track -->
          <div style="position:absolute;left:16.67%;right:16.67%;top:35%;transform:translateY(-50%);height:3px;background:#e5e7eb;border-radius:4px;z-index:0"></div>
          <!-- Active track -->
          <div class="step-line" style="position:absolute;left:16.67%;top:35%;transform:translateY(-50%);height:3px;background:linear-gradient(90deg,#7c3aed,#6366f1);border-radius:4px;z-index:1"
               [style.width]="currentStep() === 1 ? '0%' : currentStep() === 2 ? '50%' : '100%'"></div>

          @for (step of [{n:1,label:'Address',icon:'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z'},
                         {n:2,label:'Payment',icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'},
                         {n:3,label:'Confirm',icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'}]; track step.n) {
            <div style="display:flex;flex-direction:column;align-items:center;flex:1;position:relative;z-index:2">
              <button class="step-btn"
                [style]="currentStep()>=step.n
                  ? 'width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(124,58,237,.45);color:#fff'
                  : 'width:40px;height:40px;border-radius:50%;background:#fff;border:2px solid #e5e7eb;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#9ca3af'"
                [disabled]="submitting()"
                (click)="step.n===1?currentStep.set(1):step.n===2?navigateToPaymentStep():navigateToConfirmStep()"
                [attr.aria-current]="currentStep()===step.n?'step':null">
                @if (currentStep() > step.n) {
                  <svg style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                } @else {
                  <svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="step.icon"/></svg>
                }
              </button>
              <span style="font-size:11px;font-weight:700;margin-top:6px;text-align:center"
                    [style.color]="currentStep()>=step.n?'#7c3aed':'#9ca3af'">{{ step.label }}</span>
            </div>
          }
        </div>
      </div>

      @if (cartStore.isEmpty()) {
        <div style="background:#fff;border-radius:20px;padding:64px 32px;text-align:center;max-width:420px;margin:0 auto;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <div style="width:80px;height:80px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px">
            <svg style="width:36px;height:36px;color:#d1d5db" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 7H4L5 9z"/></svg>
          </div>
          <h3 style="font-size:18px;font-weight:800;color:#1a1a2e;margin-bottom:8px">Cart is Empty</h3>
          <p style="font-size:13px;color:#6b7280;margin-bottom:24px">Add some items before checking out.</p>
          <a routerLink="/products" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;padding:12px 32px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none">Shop Now</a>
        </div>
      } @else {
        <div style="display:grid;grid-template-columns:1fr;gap:24px" class="lg:grid-cols-[1fr_380px]">

          <!-- LEFT COLUMN -->
          <div style="display:flex;flex-direction:column;gap:20px">

            <!-- SECTION 1: SHIPPING ADDRESS -->
            <div style="background:#fff;border-radius:20px;padding:24px;box-shadow:0 2px 16px rgba(0,0,0,.07);border:2px solid transparent;transition:border-color .3s"
                 [style.borderColor]="currentStep()===1?'#7c3aed':'transparent'">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #f3f4f6">
                <div style="display:flex;align-items:center;gap:12px">
                  <div style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(124,58,237,.3)">
                    <svg style="width:18px;height:18px;color:#fff" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div>
                    <h2 style="font-size:16px;font-weight:800;color:#1a1a2e;margin:0">Shipping Address</h2>
                    <p style="font-size:11px;color:#6b7280;margin:2px 0 0">Where should we deliver?</p>
                  </div>
                </div>
                @if (currentStep() > 1) {
                  <button (click)="currentStep.set(1)" style="font-size:12px;color:#7c3aed;font-weight:700;background:rgba(124,58,237,.08);border:none;border-radius:8px;padding:6px 12px;cursor:pointer">Edit</button>
                }
              </div>

              <!-- Saved addresses -->
              @if (savedAddresses().length > 0) {
                <div class="address-grid">
                  @for (addr of savedAddresses(); track (addr.id || addr._id)) {
                    <div (click)="selectAddress(addr)" (keydown.enter)="selectAddress(addr)" (keydown.space)="selectAddress(addr)"
                         style="border:2px solid;border-radius:14px;padding:14px;cursor:pointer;position:relative;transition:all .25s"
                         [class]="selectedAddressId()===(addr.id||addr._id)&&!showNewAddressForm()?'address-card-selected':''"
                         [style.borderColor]="selectedAddressId()===(addr.id||addr._id)&&!showNewAddressForm()?'#7c3aed':'#e5e7eb'"
                         role="radio" [attr.aria-checked]="selectedAddressId()===(addr.id||addr._id)&&!showNewAddressForm()" tabindex="0">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                        <span style="font-size:10px;font-weight:700;background:#f3f4f6;color:#6b7280;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:.5px">{{ addr.label || 'Address' }}</span>
                        <div style="display:flex;align-items:center;gap:6px">
                          @if (addr.isDefault) {
                            <span style="font-size:10px;font-weight:700;background:rgba(124,58,237,.1);color:#7c3aed;padding:3px 8px;border-radius:6px">Default</span>
                          }
                          <button (click)="onDeleteAddress($event, addr.id || addr._id)"
                                  style="background:none;border:none;color:#ef4444;cursor:pointer;padding:4px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background-color 0.2s"
                                  class="hover:bg-red-50"
                                  title="Delete Address"
                                  aria-label="Delete Address">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                      <p style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0 0 4px">{{ addr.fullName || authStore.fullName() }}</p>
                      <p style="font-size:12px;color:#6b7280;margin:0 0 4px;line-height:1.5">{{ addr.street }}, {{ addr.city }}, {{ addr.state }} - {{ addr.zipCode }}</p>
                      <p style="font-size:12px;color:#6b7280;margin:0;font-weight:600"><i class="bi bi-telephone me-1 text-[var(--color-primary)]"></i>{{ addr.phone }}</p>
                      @if (selectedAddressId()===(addr.id||addr._id)&&!showNewAddressForm()) {
                        <div style="position:absolute;bottom:12px;right:12px;width:22px;height:22px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:50%;display:flex;align-items:center;justify-content:center">
                          <svg style="width:12px;height:12px;color:#fff" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                      }
                    </div>
                  }
                </div>
                <button (click)="toggleNewAddressForm()" [attr.aria-expanded]="showNewAddressForm()"
                        style="font-size:13px;color:#7c3aed;font-weight:700;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:6px;padding:0;margin-bottom:showNewAddressForm()?16px:0">
                  <svg style="width:16px;height:16px;transition:transform .3s" [style.transform]="showNewAddressForm()?'rotate(45deg)':'rotate(0)'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  {{ showNewAddressForm() ? 'Cancel' : '+ Add New Address' }}
                </button>
              }

              <!-- Address form -->
              @if (showNewAddressForm() || savedAddresses().length === 0) {
                <form [formGroup]="addressForm" style="display:grid;grid-template-columns:1fr;gap:14px" class="sm:grid-cols-2" novalidate>

                  @for (field of [
                    {name:'fullName', label:'Full Name', type:'text', placeholder:'e.g. Priya Sharma', col:1},
                    {name:'phone',    label:'Phone Number', type:'tel', placeholder:'+91 98765 43210', col:1},
                    {name:'street',   label:'Street Address', type:'text', placeholder:'House no, block, area, landmark…', col:2},
                    {name:'city',     label:'City', type:'text', placeholder:'e.g. Mumbai', col:1},
                    {name:'state',    label:'State', type:'text', placeholder:'e.g. Maharashtra', col:1},
                    {name:'country',  label:'Country', type:'text', placeholder:'India', col:1},
                    {name:'zipCode',  label:'PIN Code', type:'text', placeholder:'6-digit PIN', col:1}
                  ]; track field.name) {
                    <div [style.gridColumn]="field.col===2?'1/-1':'auto'">
                      <label [for]="field.name" style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px">{{ field.label }} <span style="color:#ef4444">*</span></label>
                      <input [id]="field.name" [type]="field.type" [formControlName]="field.name" [placeholder]="field.placeholder"
                             [maxlength]="field.name==='zipCode'?6:200"
                             class="form-field"
                             style="width:100%;border:2px solid;border-radius:10px;padding:10px 14px;font-size:14px;color:#1a1a2e;background:#fff;box-sizing:border-box"
                             [style.borderColor]="isInvalid(field.name)?'#ef4444':'#e5e7eb'"
                             [attr.aria-required]="true" [attr.aria-invalid]="isInvalid(field.name)">
                      @if (isInvalid(field.name)) {
                        <p role="alert" style="color:#ef4444;font-size:11px;font-weight:600;margin:4px 0 0;display:flex;align-items:center;gap:4px">
                          <svg style="width:12px;height:12px;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          {{ field.label }} is required
                        </p>
                      }
                    </div>
                  }

                  <div style="display:flex;align-items:center;gap:10px;grid-column:1/-1">
                    <input id="isDefault" type="checkbox" formControlName="isDefault"
                           style="width:16px;height:16px;accent-color:#7c3aed;cursor:pointer">
                    <label for="isDefault" style="font-size:13px;color:#374151;cursor:pointer;font-weight:500">Save as default shipping address</label>
                  </div>
                </form>
              }
            </div>

            <!-- SECTION 2: PAYMENT METHOD -->
            <div style="background:#fff;border-radius:20px;padding:24px;box-shadow:0 2px 16px rgba(0,0,0,.07);border:2px solid transparent;transition:border-color .3s"
                 [style.borderColor]="currentStep()===2?'#7c3aed':'transparent'">

              <!-- Header -->
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #f3f4f6">
                <div style="width:36px;height:36px;background:linear-gradient(135deg,#059669,#0d9488);border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(5,150,105,.3)">
                  <svg style="width:18px;height:18px;color:#fff" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <div>
                  <h2 style="font-size:16px;font-weight:800;color:#1a1a2e;margin:0">Payment Method</h2>
                  <p style="font-size:11px;color:#6b7280;margin:2px 0 0">All transactions are encrypted and secure</p>
                </div>
              </div>

              <!-- Razorpay option card -->
              <div (click)="selectedPayment.set('razorpay'); currentStep.set(2);"
                   (keydown.enter)="selectedPayment.set('razorpay'); currentStep.set(2);"
                   style="border:2px solid;border-radius:16px;padding:20px;cursor:pointer;transition:all .3s;position:relative;overflow:hidden"
                   [style.borderColor]="selectedPayment()==='razorpay'?'#7c3aed':'#e5e7eb'"
                   [style.background]="selectedPayment()==='razorpay'?'linear-gradient(135deg,rgba(124,58,237,.05),rgba(99,102,241,.03))':'#fafafa'"
                   role="radio" [attr.aria-checked]="selectedPayment()==='razorpay'" tabindex="0">

                <!-- Selected glow -->
                @if (selectedPayment()==='razorpay') {
                  <div style="position:absolute;top:0;right:0;width:80px;height:80px;background:radial-gradient(circle,rgba(124,58,237,.12) 0%,transparent 70%);pointer-events:none"></div>
                }

                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
                  <div style="display:flex;align-items:center;gap:14px;flex:1">
                    <!-- Razorpay icon -->
                    <div style="width:52px;height:52px;background:linear-gradient(135deg,#072654,#1a56db);border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(7,38,84,.3)">
                      <svg style="width:26px;height:26px;color:#fff" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                    </div>
                    <div>
                      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                        <p style="font-size:15px;font-weight:800;color:#1a1a2e;margin:0">Online Payment</p>
                        <span style="font-size:10px;font-weight:700;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:6px">RECOMMENDED</span>
                      </div>
                      <p style="font-size:12px;color:#6b7280;margin:0">Pay via UPI, Debit/Credit Card, Net Banking, Wallet</p>
                    </div>
                  </div>
                  <!-- Radio indicator -->
                  <div style="width:22px;height:22px;border-radius:50%;border:2px solid;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .25s;margin-top:2px"
                       [style.borderColor]="selectedPayment()==='razorpay'?'#7c3aed':'#d1d5db'"
                       [style.background]="selectedPayment()==='razorpay'?'linear-gradient(135deg,#7c3aed,#6366f1)':'transparent'">
                    @if (selectedPayment()==='razorpay') {
                      <div style="width:8px;height:8px;background:#fff;border-radius:50%"></div>
                    }
                  </div>
                </div>

                <!-- Payment method badges -->
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px">
                  @for (m of [
                    {label:'UPI', sub:'GPay | PhonePe', color:'#1a73e8'},
                    {label:'VISA / MC', sub:'Debit | Credit', color:'#c62828'},
                    {label:'Net Banking', sub:'All banks', color:'#1b5e20'},
                    {label:'Wallets', sub:'Paytm | Amazon', color:'#e65100'}
                  ]; track m.label) {
                    <div style="display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:6px 10px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
                      <div style="width:8px;height:8px;border-radius:50%;flex-shrink:0" [style.background]="m.color"></div>
                      <div>
                        <p style="font-size:11px;font-weight:700;color:#1a1a2e;margin:0">{{ m.label }}</p>
                        <p style="font-size:10px;color:#9ca3af;margin:0">{{ m.sub }}</p>
                      </div>
                    </div>
                  }
                </div>

                <!-- Security row -->
                @if (selectedPayment()==='razorpay') {
                  <div style="margin-top:14px;padding:10px 14px;background:rgba(5,150,105,.06);border:1px solid rgba(5,150,105,.15);border-radius:10px;display:flex;align-items:center;gap:8px">
                    <svg style="width:14px;height:14px;color:#059669;flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    <span style="font-size:12px;color:#047857;font-weight:600">Secured by Razorpay | 256-bit SSL | PCI DSS Level 1 Certified</span>
                  </div>
                }
              </div>

              <!-- How it works -->
              <div style="margin-top:16px;padding:14px;background:linear-gradient(135deg,#f8f4ff,#f0f9ff);border-radius:12px;border:1px dashed rgba(124,58,237,.2)">
                <p style="font-size:12px;font-weight:700;color:#7c3aed;margin:0 0 8px;display:flex;align-items:center;gap:6px">
                  <svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  How it works
                </p>
                <div style="display:flex;flex-direction:column;gap:6px">
                  @for (step of ['Click "Place Order" : your order is created securely','Razorpay payment window opens : choose UPI, Card or Net Banking','Payment confirmed instantly : you receive an order confirmation']; track step) {
                    <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#4b5563">
                      <div style="width:18px;height:18px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
                        <span style="font-size:9px;color:#fff;font-weight:800">{{ $index + 1 }}</span>
                      </div>
                      {{ step }}
                    </div>
                  }
                </div>
              </div>
            </div>

          </div><!-- end left column -->

          <!-- RIGHT COLUMN: Order Summary -->
          <div style="position:relative">
            <div style="position:sticky;top:20px;display:flex;flex-direction:column;gap:16px">

              <!-- Order Summary Card -->
              <div style="background:#fff;border-radius:20px;padding:24px;box-shadow:0 4px 24px rgba(0,0,0,.09);border:2px solid transparent;transition:border-color .3s"
                   [style.borderColor]="currentStep()===3?'#7c3aed':'transparent'">

                <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #f3f4f6">
                  <div style="width:32px;height:32px;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:9px;display:flex;align-items:center;justify-content:center">
                    <svg style="width:16px;height:16px;color:#fff" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                  </div>
                  <h2 style="font-size:16px;font-weight:800;color:#1a1a2e;margin:0">Order Summary</h2>
                </div>

                <!-- Items -->
                <div style="max-height:220px;overflow-y:auto;margin-bottom:16px" role="list">
                  @for (item of cartStore.cart().items; track item.variantSku) {
                    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f9fafb" role="listitem">
                      <div style="position:relative;flex-shrink:0">
                        <img [src]="item.image||'/assets/placeholder-product.jpg'" [alt]="item.title"
                             style="width:48px;height:48px;object-fit:cover;border-radius:10px;background:#f3f4f6" loading="lazy">
                        <span style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:50%;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">{{ item.quantity }}</span>
                      </div>
                      <div style="flex:1;min-width:0">
                        <p style="font-size:13px;font-weight:700;color:#1a1a2e;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ item.title }}</p>
                        @if (item.size || item.color) {
                          <p style="font-size:11px;color:#9ca3af;margin:2px 0 0">{{ item.size ? 'Size: '+item.size : '' }}{{ item.size && item.color ? ' | ' : '' }}{{ item.color || '' }}</p>
                        }
                      </div>
                      <span style="font-size:13px;font-weight:700;color:#1a1a2e;white-space:nowrap"><i class="bi bi-currency-rupee"></i>{{ (item.price * item.quantity) | number:'1.0-0' }}</span>
                    </div>
                  }
                </div>

                <!-- Price breakdown -->
                <div style="background:#f9fafb;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
                  <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280">
                    <span>Subtotal ({{ cartStore.cart().items?.length || 0 }} items)</span>
                    <span style="font-weight:600;color:#374151"><i class="bi bi-currency-rupee"></i>{{ cartStore.subTotal() | number:'1.0-0' }}</span>
                  </div>
                  @if (cartStore.cart().discountAmount > 0) {
                    <div style="display:flex;justify-content:space-between;font-size:13px;color:#16a34a;font-weight:700">
                      <span style="display:flex;align-items:center;gap:4px">
                        <svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                        Promo Discount
                      </span>
                      <span>-<i class="bi bi-currency-rupee"></i>{{ cartStore.cart().discountAmount | number:'1.0-0' }}</span>
                    </div>
                  }
                  <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280">
                    <span>Shipping</span>
                    @if (cartStore.subTotal() >= cartStore.freeShippingThreshold) {
                      <span style="font-weight:700;color:#16a34a;background:#dcfce7;padding:2px 8px;border-radius:6px;font-size:12px">FREE</span>
                    } @else {
                      <span style="font-weight:600;color:#374151"><i class="bi bi-currency-rupee"></i>49</span>
                    }
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:13px;color:#6b7280">
                    <span>GST (5%)</span>
                    <span style="font-weight:600;color:#374151"><i class="bi bi-currency-rupee"></i>{{ (cartStore.subTotal() * 0.05) | number:'1.0-0' }}</span>
                  </div>
                </div>

                <!-- Grand Total -->
                <div style="background:linear-gradient(135deg,rgba(124,58,237,.08),rgba(99,102,241,.05));border:1px solid rgba(124,58,237,.15);border-radius:14px;padding:16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
                  <div>
                    <p style="font-size:12px;color:#7c3aed;font-weight:700;margin:0">Total Amount</p>
                    <p style="font-size:11px;color:#9ca3af;margin:2px 0 0">Inclusive of all taxes</p>
                  </div>
                  <span class="amount-pulse" style="font-size:26px;font-weight:900;color:#7c3aed"><i class="bi bi-currency-rupee"></i>{{ grandTotal() | number:'1.0-0' }}</span>
                </div>

                <!-- Error message -->
                @if (errorMessage()) {
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;margin-bottom:14px" role="alert">
                    <svg style="width:16px;height:16px;color:#ef4444;flex-shrink:0;margin-top:1px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p style="font-size:12px;color:#dc2626;font-weight:600;margin:0">{{ errorMessage() }}</p>
                  </div>
                }

                <!-- Place Order Button -->
                <button id="place-order-btn"
                  (click)="onSubmitOrder()"
                  [disabled]="submitting() || (!selectedAddressId() && addressForm.invalid)"
                  class="place-btn"
                  style="width:100%;padding:16px;border:none;border-radius:14px;color:#fff;font-size:16px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;letter-spacing:.3px"
                  [style.opacity]="(submitting()||(!selectedAddressId()&&addressForm.invalid))?'0.6':'1'"
                  [style.cursor]="(submitting()||(!selectedAddressId()&&addressForm.invalid))?'not-allowed':'pointer'"
                  aria-label="Place order securely"
                  [attr.aria-busy]="submitting()">
                  @if (submitting()) {
                    <svg style="width:20px;height:20px;animation:spin 1s linear infinite" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <circle style="opacity:.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path style="opacity:.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    {{ paymentStep() || 'Processing…' }}
                  } @else {
                    <svg style="width:20px;height:20px" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    Place Order Securely
                  }
                </button>
                <style>@keyframes spin{to{transform:rotate(360deg)}}</style>

                <!-- Trust indicators -->
                <div style="margin-top:14px;display:flex;flex-direction:column;gap:8px">
                  <div style="display:flex;align-items:center;justify-content:center;gap:6px">
                    <i class="bi bi-shield-fill-check text-green-600"></i>
                    <span style="font-size:12px;color:#059669;font-weight:700">256-bit SSL | PCI DSS Certified</span>
                  </div>
                  <div class="trust-row" style="border-radius:10px;padding:10px 14px;display:grid;grid-template-columns:repeat(3, 1fr);gap:8px">
                    <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;color:#6b7280;font-weight:600">
                      <i class="bi bi-truck text-[var(--color-primary)]" style="font-size:14px"></i>
                      <span>Free <i class="bi bi-currency-rupee"></i>499+</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;color:#6b7280;font-weight:600">
                      <i class="bi bi-arrow-counterclockwise text-[var(--color-primary)]" style="font-size:14px"></i>
                      <span>7-Day Returns</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px;color:#6b7280;font-weight:600">
                      <i class="bi bi-shield-check text-[var(--color-primary)]" style="font-size:14px"></i>
                      <span>100% Authentic</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Virtual payment security card -->
              <div class="pay-card" style="border-radius:20px;padding:20px;color:#fff;box-shadow:0 8px 32px rgba(124,58,237,.4)">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
                  <div>
                    <p style="font-size:10px;font-weight:700;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px">Payment Security</p>
                    <p style="font-size:14px;font-weight:800;margin:0">Your data is safe</p>
                  </div>
                  <div style="width:40px;height:40px;background:rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center">
                    <svg style="width:20px;height:20px;color:#fff" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px">
                  @for (point of ['Card details never stored on our servers','HMAC-SHA256 signature verification','RBI compliant payment processing']; track point) {
                    <div style="display:flex;align-items:center;gap:8px;font-size:12px;opacity:.9">
                      <svg style="width:14px;height:14px;flex-shrink:0;color:#34d399" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      {{ point }}
                    </div>
                  }
                </div>
              </div>

            </div><!-- end sticky -->
          </div><!-- end right column -->

        </div><!-- end grid -->
      }
    </div>
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
  currentStep = signal<number>(1);
  paymentStep = signal<string>('');

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
    this.loadRazorpayScript();
  }

  private loadRazorpayScript() {
    if ((window as any)['Razorpay']) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => console.warn('[Razorpay] Failed to load checkout.js');
    document.head.appendChild(script);
  }

  isInvalid(controlName: string): boolean {
    const ctrl: AbstractControl | null = this.addressForm.get(controlName);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  loadUserAddresses() {
    const user = this.authStore.user();
    if (user && user.addresses) {
      const unique: any[] = [];
      const seen = new Set<string>();
      for (const a of user.addresses) {
        const id = a.id || a._id || `${a.street}_${a.zipCode}`;
        if (!seen.has(id)) {
          seen.add(id);
          unique.push(a);
        }
      }
      this.savedAddresses.set(unique);

      const def = unique.find((a: any) => a.isDefault);
      if (def) {
        this.selectedAddressId.set(def._id || def.id);
        this.currentStep.set(2);
      } else if (unique.length > 0) {
        this.selectedAddressId.set(unique[0]._id || unique[0].id);
        this.currentStep.set(2);
      } else {
        this.currentStep.set(1);
      }
    } else {
      this.currentStep.set(1);
    }
  }

  onDeleteAddress(event: Event, addressId: string) {
    event.stopPropagation();
    if (!addressId) return;

    this.authStore.deleteAddress(addressId).subscribe({
      next: () => {
        this.loadUserAddresses();
        if (this.selectedAddressId() === addressId) {
          const remaining = this.savedAddresses();
          if (remaining.length > 0) {
            const def = remaining.find(a => a.isDefault) || remaining[0];
            this.selectedAddressId.set(def.id || def._id);
          } else {
            this.selectedAddressId.set(null);
            this.currentStep.set(1);
          }
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Failed to delete address.');
        this.cdr.markForCheck();
      }
    });
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
    this.paymentStep.set('Creating your order…');
    this.cdr.markForCheck();

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
      next: (res) => this.initiateRazorpayPayment(res.data?.orderId ?? res.data?.id, res.data?.orderNumber),
      error: (err) => {
        this.submitting.set(false);
        this.paymentStep.set('');
        this.currentStep.set(2);
        this.errorMessage.set(err.error?.message || 'Order placement failed. Please check item stock and try again.');
        this.cdr.markForCheck();
      },
    });
  }

  private initiateRazorpayPayment(orderId: number, orderNumber: string) {
    this.paymentStep.set('Initialising payment…');
    this.cdr.markForCheck();

    this.http.post<any>(`${environment.apiUrl}/payments/razorpay/create-order/${orderId}`, {}).subscribe({
      next: (res) => this.openRazorpayPopup(res.data, orderNumber),
      error: (err) => {
        this.submitting.set(false);
        this.paymentStep.set('');
        this.currentStep.set(2);
        this.errorMessage.set(err.error?.message || 'Failed to initialise payment. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

  private openRazorpayPopup(paymentData: any, orderNumber: string) {
    this.paymentStep.set('');
    this.submitting.set(false);
    this.cdr.markForCheck();

    const RazorpayClass = (window as any)['Razorpay'];
    if (!RazorpayClass) {
      this.errorMessage.set('Payment gateway failed to load. Please refresh and try again.');
      this.cdr.markForCheck();
      return;
    }

    const user = this.authStore.user();
    const options = {
      key: paymentData.razorpayKeyId,
      amount: paymentData.amount, // in paise
      currency: 'INR',
      name: 'Happy Hamper',
      description: `Order #${orderNumber}`,
      order_id: paymentData.razorpayOrderId,
      prefill: {
        name: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        email: (user as any)?.email ?? '',
        contact: user?.phone ?? '',
      },
      // Restrict to INR-compatible (domestic) payment methods only.
      // This prevents "International cards are not supported" errors.
      config: {
        display: {
          blocks: {
            banks: {
              name: 'Pay via UPI / Cards / Net Banking',
              instruments: [
                { method: 'upi' },
                { method: 'card', issuers: ['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK'] },
                { method: 'netbanking' },
                { method: 'wallet' },
              ],
            },
          },
          sequence: ['block.banks'],
          preferences: { show_default_blocks: true },
        },
      },
      theme: { color: '#7C3AED' },
      modal: {
        backdropclose: false,
        ondismiss: () => {
          this.submitting.set(false);
          this.paymentStep.set('');
          this.errorMessage.set(
            'Payment was cancelled. Your order is saved — you can retry payment from your Orders page.'
          );
          this.currentStep.set(2);
          this.cdr.markForCheck();
        },
      },
      // Handles payment failures reported INSIDE the Razorpay popup (e.g., wrong card type)
      'payment.failed': (response: any) => {
        this.submitting.set(false);
        this.paymentStep.set('');
        const errCode = response?.error?.code ?? '';
        const errDesc = response?.error?.description ?? '';
        const errReason = response?.error?.reason ?? '';

        let userMessage: string;
        if (
          errReason === 'payment_failed' &&
          (errDesc.toLowerCase().includes('international') ||
           errCode === 'BAD_REQUEST_ERROR')
        ) {
          userMessage =
            'International cards are not supported. Please pay using a domestic card (Visa/Mastercard issued by an Indian bank), UPI (GPay / PhonePe), or Net Banking.';
        } else if (errDesc) {
          userMessage = `Payment failed: ${errDesc}. Please try a different payment method.`;
        } else {
          userMessage =
            'Payment failed. Please try again using UPI, a domestic debit/credit card, or Net Banking.';
        }
        this.errorMessage.set(userMessage);
        this.cdr.markForCheck();
      },
      handler: (response: any) => {
        this.verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          paymentData.orderId,
          orderNumber
        );
      },
    };

    const rzp = new RazorpayClass(options);
    rzp.open();
  }

  private verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    orderId: number,
    orderNumber: string
  ) {
    this.submitting.set(true);
    this.paymentStep.set('Verifying payment…');
    this.cdr.markForCheck();

    this.http.post<any>(`${environment.apiUrl}/payments/razorpay/verify`, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    }).subscribe({
      next: () => {
        this.cartStore.clearCart();
        this.router.navigate(['/checkout/success'], {
          queryParams: { orderId, orderNumber }
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.submitting.set(false);
        this.paymentStep.set('');
        this.errorMessage.set(err.error?.message || 'Payment verification failed. Please contact support with your order number: ' + orderNumber);
        this.cdr.markForCheck();
      },
    });
  }
}
