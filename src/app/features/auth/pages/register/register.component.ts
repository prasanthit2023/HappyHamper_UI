import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'bb-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="animate-slide-up max-w-md mx-auto bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm">
      <div class="text-center mb-8">
        <h1 class="font-display font-bold text-3xl text-neutral-900 mb-2">Create account</h1>
        <p class="text-neutral-500 text-sm">Join Happy Hamper today</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
        @if (authStore.error()) {
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {{ authStore.error() }}
          </div>
        }

        <div>
          <label for="name" class="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Full Name</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder="e.g. Priya Sharma"
            class="input-field"
            autocomplete="name"
            [class.border-red-400]="isInvalid('name')"
          />
          @if (isInvalid('name')) {
            <p class="text-red-500 text-xs mt-1">Full name is required (max 100 characters).</p>
          }
        </div>

        <div>
          <label for="phone" class="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Mobile Number</label>
          <input
            id="phone"
            type="tel"
            formControlName="phone"
            placeholder="e.g. +919876543210"
            class="input-field"
            autocomplete="tel"
            [class.border-red-400]="isInvalid('phone')"
          />
          @if (isInvalid('phone')) {
            <p class="text-red-500 text-xs mt-1">Please enter a valid mobile number (e.g. +919876543210).</p>
          }
        </div>

        <div>
          <label for="password" class="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Password</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            placeholder="Min 6 characters"
            class="input-field"
            autocomplete="new-password"
            [class.border-red-400]="isInvalid('password')"
          />
          @if (isInvalid('password')) {
            <p class="text-red-500 text-xs mt-1">Password must be at least 6 characters.</p>
          }
        </div>

        <div>
          <label for="referralCode" class="block text-xs font-bold text-neutral-500 mb-1.5 uppercase tracking-wider">Referral Code</label>
          <input
            id="referralCode"
            type="text"
            formControlName="referralCode"
            placeholder="Optional (e.g. AB12CD34)"
            class="input-field uppercase"
            maxlength="8"
            [class.border-red-400]="isInvalid('referralCode')"
          />
          @if (isInvalid('referralCode')) {
            <p class="text-red-500 text-xs mt-1">Referral code must be at most 8 characters.</p>
          }
        </div>

        <button
          type="submit"
          class="btn-primary w-full py-3.5 text-base font-semibold"
          [disabled]="form.invalid || authStore.loading()"
          id="register-btn"
        >
          @if (authStore.loading()) {
            <svg class="animate-spin w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating account...
          } @else {
            Create Account
          }
        </button>
      </form>

      <p class="text-center text-sm text-neutral-500 mt-6">
        Already have an account?
        <a routerLink="/auth/login" class="text-primary-500 font-semibold hover:text-primary-600 transition-colors">Sign in</a>
      </p>
    </div>
  `,
})
export class RegisterComponent {
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{6,14}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    referralCode: ['', [Validators.maxLength(8)]],
  });

  isInvalid(controlName: string) {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      name: value.name!.trim(),
      phone: value.phone!.trim(),
      password: value.password!,
      ...(value.referralCode?.trim() ? { referralCode: value.referralCode.trim().toUpperCase() } : {}),
    };

    this.authStore.register(payload).subscribe((result) => {
      if (!result) return;
      this.router.navigate(['/auth/verify-otp'], {
        queryParams: { phone: payload.phone },
      });
    });
  }
}
