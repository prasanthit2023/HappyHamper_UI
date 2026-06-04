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
    <div class="animate-slide-up">
      <div class="text-center mb-8">
        <h1 class="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">Create account</h1>
        <p class="text-neutral-500">Join Happy Hamper today</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        @if (authStore.error()) {
          <div class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {{ authStore.error() }}
          </div>
        }

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="firstName" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">First name</label>
            <input id="firstName" type="text" formControlName="firstName" class="input-field" autocomplete="given-name" />
            @if (isInvalid('firstName')) {
              <p class="text-red-500 text-xs mt-1">First name is required.</p>
            }
          </div>

          <div>
            <label for="lastName" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Last name</label>
            <input id="lastName" type="text" formControlName="lastName" class="input-field" autocomplete="family-name" />
            @if (isInvalid('lastName')) {
              <p class="text-red-500 text-xs mt-1">Last name is required.</p>
            }
          </div>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email</label>
          <input id="email" type="email" formControlName="email" class="input-field" placeholder="your@email.com" autocomplete="email" />
          @if (isInvalid('email')) {
            <p class="text-red-500 text-xs mt-1">Enter a valid email.</p>
          }
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Phone</label>
          <input id="phone" type="tel" formControlName="phone" class="input-field" placeholder="+919876543210" autocomplete="tel" />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Password</label>
          <div class="relative">
            <input
              id="password"
              [type]="showPassword ? 'text' : 'password'"
              formControlName="password"
              class="input-field pr-10"
              placeholder="Minimum 8 characters"
              autocomplete="new-password"
            />
            <button type="button" (click)="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              @if (showPassword) {
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M3 3l18 18" />
                </svg>
              } @else {
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            </button>
          </div>
          @if (isInvalid('password')) {
            <p class="text-red-500 text-xs mt-1">Use 8+ characters with uppercase, lowercase, and a number.</p>
          }
        </div>

        <div>
          <label for="referralCode" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Referral code</label>
          <input id="referralCode" type="text" formControlName="referralCode" class="input-field uppercase" maxlength="8" placeholder="Optional" />
        </div>

        <button type="submit" class="btn-primary w-full py-3.5 text-base" [disabled]="form.invalid || authStore.loading()">
          @if (authStore.loading()) {
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
        <a routerLink="/auth/login" class="text-primary-500 font-semibold hover:text-primary-600">Sign in</a>
      </p>
    </div>
  `,
})
export class RegisterComponent {
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  showPassword = false;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
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
      firstName: value.firstName?.trim(),
      lastName: value.lastName?.trim(),
      email: value.email?.trim().toLowerCase(),
      password: value.password,
      ...(value.phone?.trim() ? { phone: value.phone.trim() } : {}),
      ...(value.referralCode?.trim() ? { referralCode: value.referralCode.trim().toUpperCase() } : {}),
    };

    this.authStore.register(payload).subscribe((result) => {
      if (!result) return;
      this.router.navigate(['/auth/verify-otp'], {
        queryParams: { email: payload.email },
      });
    });
  }
}
