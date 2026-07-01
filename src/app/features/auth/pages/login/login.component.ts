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
    <div class="animate-slide-up max-w-md mx-auto bg-white p-8 rounded-2xl border border-[var(--color-border)] shadow-sm">
      <div class="text-center mb-8">
        <h1 class="font-display font-bold text-3xl text-[var(--color-text)] mb-2">Welcome Back</h1>
        <p class="text-[var(--color-text-muted)] text-sm">Sign in to your Happy Hamper account</p>
      </div>

      <!-- Tab Switcher -->
      <div class="flex border border-[var(--color-border)] mb-6 bg-[var(--color-bg-subtle)] p-1 rounded-xl">
        <button
          type="button"
          (click)="switchMode('phone')"
          class="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200"
          [class.bg-white]="loginMode() === 'phone'"
          [class.shadow-sm]="loginMode() === 'phone'"
          [class.text-[var(--color-primary)]]="loginMode() === 'phone'"
          [class.text-[var(--color-text-muted)]]="loginMode() !== 'phone'"
          [class.hover:text-[var(--color-text)]]="loginMode() !== 'phone'"
          id="tab-whatsapp"
        >
          WhatsApp OTP
        </button>
        <button
          type="button"
          (click)="switchMode('password')"
          class="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-200"
          [class.bg-white]="loginMode() === 'password'"
          [class.shadow-sm]="loginMode() === 'password'"
          [class.text-[var(--color-primary)]]="loginMode() === 'password'"
          [class.text-[var(--color-text-muted)]]="loginMode() !== 'password'"
          [class.hover:text-[var(--color-text)]]="loginMode() !== 'password'"
          id="tab-password"
        >
          Mobile + Password
        </button>
      </div>

      <!-- Error alert -->
      @if (authStore.error()) {
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold mb-6 animate-fade-in" role="alert">
          {{ authStore.error() }}
        </div>
      }

      @if (loginMode() === 'phone') {
        <!-- Step 1: Enter Phone Number -->
        @if (step() === 'phone') {
          <form [formGroup]="phoneForm" (ngSubmit)="onSendOtp()" class="space-y-5" novalidate>
            <div class="floating-label-group">
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                placeholder=" "
                class="floating-label-input"
                autocomplete="tel"
                inputmode="numeric"
                maxlength="10"
                (keypress)="allowOnlyDigits($event)"
                [class.border-red-400]="isPhoneInvalid()"
              />
              <label
                for="phone"
                class="floating-label-text"
              >
                Mobile Number *
              </label>
              @if (isPhoneInvalid()) {
                <p class="text-red-500 text-[10px] mt-1.5 flex items-center gap-1 font-semibold">
                Please enter a valid 10-digit mobile number.
                </p>
              }
            </div>

            <button
              type="submit"
              class="btn-primary w-full py-3.5 text-sm font-bold shadow-warm mt-2"
              [disabled]="phoneForm.invalid || authStore.loading()"
              id="send-otp-btn"
            >
              @if (authStore.loading()) {
                <svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
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
          <form [formGroup]="otpForm" (ngSubmit)="onVerifyOtp()" class="space-y-5" novalidate>
            <div class="bg-[var(--color-primary-light)] border border-[var(--color-primary)] border-opacity-20 text-[var(--color-primary)] px-4 py-3.5 rounded-xl text-xs font-semibold mb-2">
              We have shared a 6-digit OTP code to <strong class="text-[var(--color-text)]">{{ phoneForm.value.phone }}</strong> via WhatsApp.
              @if (receivedDevOtp) {
                <div class="mt-2 text-[10px] font-bold text-[var(--color-text-muted)] bg-white p-2 rounded-lg border border-[var(--color-border)]">
                  [DEV TEST OTP]: <span class="text-[var(--color-primary)] font-mono text-xs font-bold">{{ receivedDevOtp }}</span>
                </div>
              }
            </div>

            <div class="floating-label-group">
              <input
                id="otp"
                type="text"
                formControlName="otp"
                placeholder=" "
                maxlength="6"
                class="floating-label-input text-center tracking-widest text-base font-bold"
                [class.border-red-400]="isOtpInvalid()"
              />
              <label
                for="otp"
                class="floating-label-text"
              >
                6-Digit OTP *
              </label>
              @if (isOtpInvalid()) {
                <p class="text-red-500 text-[10px] mt-1.5 flex items-center gap-1 font-semibold">
                  Please enter a valid 6-digit OTP code.
                </p>
              }
            </div>

            <button
              type="submit"
              class="btn-primary w-full py-3.5 text-sm font-bold shadow-warm mt-2"
              [disabled]="otpForm.invalid || authStore.loading()"
              id="verify-otp-btn"
            >
              @if (authStore.loading()) {
                <svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
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
                class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] font-semibold flex items-center gap-1 transition-colors"
              >
                ← Edit Phone Number
              </button>
              <button
                type="button"
                (click)="onSendOtp()"
                class="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-bold transition-colors"
                [disabled]="authStore.loading()"
              >
                Resend OTP
              </button>
            </div>
          </form>
        }
      } @else if (loginMode() === 'password') {
        <!-- Mobile Number + Password Form -->
        <form [formGroup]="phonePasswordForm" (ngSubmit)="onPhonePasswordLogin()" class="space-y-5" novalidate>
          <div class="floating-label-group">
            <input
              id="phone"
              type="tel"
              formControlName="phone"
              placeholder=" "
              class="floating-label-input"
              autocomplete="tel"
              inputmode="numeric"
              maxlength="10"
              (keypress)="allowOnlyDigits($event)"
              [class.border-red-400]="isPassPhoneInvalid()"
            />
            <label
              for="phone-login"
              class="floating-label-text"
            >
              Mobile Number *
            </label>
            @if (isPassPhoneInvalid()) {
              <p class="text-red-500 text-[10px] mt-1.5 flex items-center gap-1 font-semibold">
                Please enter a valid phone number.
              </p>
            }
          </div>

          <div class="floating-label-group">
            <input
              id="password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              placeholder=" "
              class="floating-label-input pr-10"
              autocomplete="current-password"
              [class.border-red-400]="isPasswordInvalid()"
            />
            <label
              for="password"
              class="floating-label-text"
            >
              Password *
            </label>
            <button
              type="button"
              (click)="showPassword.set(!showPassword())"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none z-10"
            >
              <i class="pi" [class.pi-eye-slash]="showPassword()" [class.pi-eye]="!showPassword()"></i>
            </button>
          </div>
          @if (isPasswordInvalid()) {
            <p class="text-red-500 text-[10px] mt-1.5 flex items-center gap-1 font-semibold">
              Password is required.
            </p>
          }

          <div class="flex justify-end text-xs">
            <a routerLink="/forgot-password" class="font-bold text-[var(--color-primary)] hover:underline">Forgot Password?</a>
          </div>

          <button
            type="submit"
            class="btn-primary w-full py-3.5 text-sm font-bold shadow-warm"
            [disabled]="phonePasswordForm.invalid || authStore.loading()"
            id="password-login-btn"
          >
            @if (authStore.loading()) {
              <svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
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

      <div class="mt-6 text-center text-xs text-[var(--color-text-muted)] font-semibold">
        Don't have an account?
        <a routerLink="/register" class="text-[var(--color-primary)] hover:underline ml-1">Register here</a>
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
  showPassword = signal<boolean>(false);

  phoneForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  phonePasswordForm = this.fb.group({
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    password: ['', [Validators.required]],
  });

  switchMode(mode: 'phone' | 'password') {
    this.loginMode.set(mode);
    this.authStore.error.set(null);
    this.step.set('phone');
  }

  allowOnlyDigits(event: KeyboardEvent): boolean {
    return /[0-9]/.test(event.key);
  }

  isPhoneInvalid(): boolean {
    const ctrl = this.phoneForm.get('phone');
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  isOtpInvalid(): boolean {
    const ctrl = this.otpForm.get('otp');
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  isPassPhoneInvalid(): boolean {
    const ctrl = this.phonePasswordForm.get('phone');
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  isPasswordInvalid(): boolean {
    const ctrl = this.phonePasswordForm.get('password');
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  onSendOtp() {
    if (this.phoneForm.invalid) {
      this.phoneForm.markAllAsTouched();
      return;
    }
    const phone = this.phoneForm.value.phone!;
    this.authStore.sendPhoneOtp(phone).subscribe((res: any) => {
      if (res) {
        this.step.set('otp');
        const otpVal = res?.otp_dev || res?.data?.otp_dev || res?.otp || res?.data?.otp;
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
