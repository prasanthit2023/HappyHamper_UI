import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'bb-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="animate-slide-up max-w-md mx-auto bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
      <div class="text-center mb-8">
        <h1 class="font-display font-bold text-3xl text-neutral-900 mb-2">Welcome!</h1>
        <p class="text-neutral-500 text-sm">Sign in to your Happy Hamper account</p>
      </div>

      <!-- Tab Switcher -->
      <div class="flex border border-neutral-200 mb-6 bg-neutral-50 p-1 rounded-xl">
        <button
          type="button"
          (click)="loginMode.set('phone')"
          class="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200"
          [class.bg-white]="loginMode() === 'phone'"
          [class.shadow-sm]="loginMode() === 'phone'"
          [class.text-primary-600]="loginMode() === 'phone'"
          [class.text-neutral-500]="loginMode() !== 'phone'"
          [class.hover:text-neutral-800]="loginMode() !== 'phone'"
          id="tab-whatsapp"
        >
          WhatsApp OTP
        </button>
        <button
          type="button"
          (click)="loginMode.set('password')"
          class="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200"
          [class.bg-white]="loginMode() === 'password'"
          [class.shadow-sm]="loginMode() === 'password'"
          [class.text-primary-600]="loginMode() === 'password'"
          [class.text-neutral-500]="loginMode() !== 'password'"
          [class.hover:text-neutral-800]="loginMode() !== 'password'"
          id="tab-password"
        >
          Mobile + Password
        </button>
      </div>

      <!-- Error alert -->
      @if (authStore.error()) {
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 animate-fade-in" role="alert">
          {{ authStore.error() }}
        </div>
      }

      @if (loginMode() === 'phone') {
        <!-- Step 1: Enter Phone Number -->
        @if (step() === 'phone') {
          <form [formGroup]="phoneForm" (ngSubmit)="onSendOtp()" class="space-y-5">
            <div>
              <label for="phone" class="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Mobile Number</label>
              <div class="relative">
                <input
                  id="phone"
                  type="tel"
                  formControlName="phone"
                  placeholder="e.g. +919876543210"
                  class="input-field"
                  autocomplete="tel"
                  [class.border-red-400]="phoneForm.get('phone')?.invalid && phoneForm.get('phone')?.touched"
                />
              </div>
              @if (phoneForm.get('phone')?.invalid && phoneForm.get('phone')?.touched) {
                <p class="text-red-500 text-xs mt-1">Please enter a valid phone number (e.g. +919876543210 or 9876543210).</p>
              }
            </div>

            <button
              type="submit"
              class="btn-primary w-full py-3.5 text-base font-semibold"
              [disabled]="phoneForm.invalid || authStore.loading()"
              id="send-otp-btn"
            >
              @if (authStore.loading()) {
                <svg class="animate-spin w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Sending OTP...
              } @else {
                Send OTP via WhatsApp
              }
            </button>
          </form>
        }

        <!-- Step 2: Enter OTP -->
        @if (step() === 'otp') {
          <form [formGroup]="otpForm" (ngSubmit)="onVerifyOtp()" class="space-y-5">
            <div class="bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3.5 rounded-xl text-sm mb-2">
              We have shared a 6-digit OTP code to <strong class="text-primary-950">{{ phoneForm.value.phone }}</strong> via WhatsApp.
              @if (receivedDevOtp) {
                <div class="mt-2 text-xs font-semibold text-neutral-600 bg-white p-2 rounded-lg border border-primary-100">
                  [DEV TEST OTP]: <span class="text-primary font-mono text-sm font-bold">{{ receivedDevOtp }}</span>
                </div>
              }
            </div>

            <div>
              <label for="otp" class="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Enter 6-Digit OTP</label>
              <input
                id="otp"
                type="text"
                formControlName="otp"
                placeholder="123456"
                maxlength="6"
                class="input-field text-center font-mono tracking-widest text-lg"
                [class.border-red-400]="otpForm.get('otp')?.invalid && otpForm.get('otp')?.touched"
              />
              @if (otpForm.get('otp')?.invalid && otpForm.get('otp')?.touched) {
                <p class="text-red-500 text-xs mt-1">Please enter a valid 6-digit OTP code.</p>
              }
            </div>

            <button
              type="submit"
              class="btn-primary w-full py-3.5 text-base font-semibold"
              [disabled]="otpForm.invalid || authStore.loading()"
              id="verify-otp-btn"
            >
              @if (authStore.loading()) {
                <svg class="animate-spin w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Verifying...
              } @else {
                Verify & Sign In
              }
            </button>

            <div class="flex items-center justify-between text-xs mt-4">
              <button
                type="button"
                (click)="step.set('phone')"
                class="text-neutral-500 hover:text-neutral-800 font-semibold flex items-center gap-1 transition-colors"
              >
                ← Edit Phone Number
              </button>
              <button
                type="button"
                (click)="onSendOtp()"
                class="text-primary-500 hover:text-primary-600 font-semibold transition-colors"
                [disabled]="authStore.loading()"
              >
                Resend OTP
              </button>
            </div>
          </form>
        }
      } @else if (loginMode() === 'password') {
        <!-- Mobile Number + Password Form -->
        <form [formGroup]="phonePasswordForm" (ngSubmit)="onPhonePasswordLogin()" class="space-y-5">
          <div>
            <label for="phone-login" class="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Mobile Number</label>
            <input
              id="phone-login"
              type="tel"
              formControlName="phone"
              placeholder="e.g. +919876543210"
              class="input-field"
              autocomplete="tel"
              [class.border-red-400]="phonePasswordForm.get('phone')?.invalid && phonePasswordForm.get('phone')?.touched"
            />
            @if (phonePasswordForm.get('phone')?.invalid && phonePasswordForm.get('phone')?.touched) {
              <p class="text-red-500 text-xs mt-1">Please enter a valid phone number (e.g. +919876543210 or 9876543210).</p>
            }
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="password" class="block text-xs font-bold text-neutral-500 uppercase tracking-wider">Password</label>
              <a routerLink="/auth/forgot-password" class="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors">Forgot Password?</a>
            </div>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              class="input-field"
              autocomplete="current-password"
              [class.border-red-400]="phonePasswordForm.get('password')?.invalid && phonePasswordForm.get('password')?.touched"
            />
            @if (phonePasswordForm.get('password')?.invalid && phonePasswordForm.get('password')?.touched) {
              <p class="text-red-500 text-xs mt-1">Password is required.</p>
            }
          </div>

          <button
            type="submit"
            class="btn-primary w-full py-3.5 text-base font-semibold"
            [disabled]="phonePasswordForm.invalid || authStore.loading()"
            id="password-login-btn"
          >
            @if (authStore.loading()) {
              <svg class="animate-spin w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Signing In...
            } @else {
              Sign In
            }
          </button>
        </form>
      }

      <div class="mt-6 text-center text-sm text-neutral-500">
        Don't have an account?
        <a routerLink="/auth/register" class="text-primary-500 font-semibold hover:text-primary-600 transition-colors">Register here</a>
      </div>
    </div>
  `,
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);
  private fb         = inject(FormBuilder);
  private router     = inject(Router);

  loginMode = signal<'phone' | 'password'>('phone');
  step = signal<'phone' | 'otp'>('phone');
  receivedDevOtp: string | null = null;

  phoneForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{6,14}$/)]],
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  phonePasswordForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{6,14}$/)]],
    password: ['', [Validators.required]],
  });

  onSendOtp() {
    if (this.phoneForm.invalid) {
      this.phoneForm.markAllAsTouched();
      return;
    }
    const phone = this.phoneForm.value.phone!;
    this.authStore.sendPhoneOtp(phone).subscribe((res: any) => {
      if (res) {
        this.step.set('otp');
        const otpVal = res?.otp || res?.data?.otp;
        if (otpVal) {
          this.receivedDevOtp = otpVal;
        }
      }
    });
  }

  onVerifyOtp() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    const phone = this.phoneForm.value.phone!;
    const otp = this.otpForm.value.otp!;
    this.authStore.verifyPhoneOtp(phone, otp).subscribe((res) => {
      if (res) {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        const target = (!returnUrl || returnUrl === '/') ? '/products' : returnUrl;
        this.router.navigateByUrl(target);
      }
    });
  }

  onPhonePasswordLogin() {
    if (this.phonePasswordForm.invalid) {
      this.phonePasswordForm.markAllAsTouched();
      return;
    }
    const phone = this.phonePasswordForm.value.phone!;
    const password = this.phonePasswordForm.value.password!;
    this.authStore.login(phone, password).subscribe((res) => {
      if (res) {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        const target = (!returnUrl || returnUrl === '/') ? '/products' : returnUrl;
        this.router.navigateByUrl(target);
      }
    });
  }
}
