import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'bb-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="animate-slide-up max-w-md mx-auto bg-white p-8 rounded-2xl border border-[var(--color-border)] shadow-sm">
      <div class="text-center mb-8">
        <h1 class="font-display font-bold text-3xl text-[var(--color-text)] mb-2">Create Account</h1>
        <p class="text-[var(--color-text-muted)] text-sm">Join Happy Hamper today</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5" novalidate>
        @if (authStore.error()) {
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold mb-2" role="alert">
            {{ authStore.error() }}
          </div>
        }

        <!-- Full Name -->
        <div class="floating-label-group">
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder=" "
            class="floating-label-input"
            autocomplete="name"
            maxlength="100"
            [class.border-red-400]="isInvalid('name')"
          />
          <label for="name" class="floating-label-text">Full Name *</label>
          @if (isInvalid('name')) {
            <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
              @if (form.get('name')?.errors?.['required']) {
                Full name is required.
              } @else if (form.get('name')?.errors?.['maxlength']) {
                Full name must be at most 100 characters.
              } @else if (form.get('name')?.errors?.['pattern']) {
                Full name must contain only letters and spaces (no special characters or numbers).
              }
            </p>
          }
        </div>

        <!-- Mobile Number (10-digit numeric only) -->
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
            [class.border-red-400]="isInvalid('phone')"
          />
          <label for="phone" class="floating-label-text">Mobile Number (10 digits) *</label>
          @if (isInvalid('phone')) {
            <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
              Please enter a valid 10-digit mobile number.
            </p>
          }
        </div>

        <!-- Password -->
        <div class="floating-label-group">
          <input
            id="password"
            type="password"
            formControlName="password"
            placeholder=" "
            class="floating-label-input"
            autocomplete="new-password"
            [class.border-red-400]="isInvalid('password')"
          />
          <label for="password" class="floating-label-text">Password *</label>
          @if (isInvalid('password')) {
            <p class="text-red-500 text-[10px] mt-1 flex items-center gap-1 font-semibold" role="alert">
              Password must be at least 6 characters.
            </p>
          }

          <!-- Password Strength Indicator -->
          @if (passwordVal()) {
            <div class="mt-2 space-y-1.5 animate-fade-in">
              <div class="flex gap-1 h-1.5">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="flex-1 rounded-full h-full transition-all duration-300"
                       [class.bg-red-400]="i <= passwordStrength() && passwordStrength() <= 2"
                       [class.bg-amber-400]="i <= passwordStrength() && passwordStrength() === 3"
                       [class.bg-emerald-400]="i <= passwordStrength() && passwordStrength() >= 4"
                       [class.bg-neutral-100]="i > passwordStrength()">
                  </div>
                }
              </div>
              <span class="text-[9px] font-bold uppercase tracking-wider block"
                    [class.text-red-500]="passwordStrength() <= 2"
                    [class.text-amber-500]="passwordStrength() === 3"
                    [class.text-emerald-500]="passwordStrength() >= 4">
                {{ passwordStrength() <= 2 ? 'Weak' : passwordStrength() === 3 ? 'Medium' : 'Strong' }} Password
              </span>
            </div>
          }
        </div>

        <button
          type="submit"
          class="btn-primary w-full py-3.5 text-sm font-bold shadow-warm mt-2"
          [disabled]="form.invalid || authStore.loading()"
          id="register-btn"
        >
          @if (authStore.loading()) {
            <svg class="animate-spin w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating Account...
          } @else {
            Create Account
          }
        </button>
      </form>

      <p class="text-center text-xs text-[var(--color-text-muted)] font-semibold mt-6">
        Already have an account?
        <a routerLink="/auth/login" class="text-[var(--color-primary)] hover:underline ml-1">Sign in</a>
      </p>
    </div>
  `,
})
export class RegisterComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  form = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z\s]+$/),
      ],
    ],
    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/),
      ],
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  passwordVal = signal<string>('');

  passwordStrength = computed(() => {
    const password = this.passwordVal();
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  });

  ngOnInit() {
    this.form.get('password')?.valueChanges.subscribe(val => {
      this.passwordVal.set(val || '');
    });
  }

  /** Prevent non-digit characters from being typed into numeric-only fields */
  allowOnlyDigits(event: KeyboardEvent): boolean {
    return /[0-9]/.test(event.key);
  }

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
    };

    this.authStore.register(payload).subscribe((result) => {
      if (!result) return;
      this.router.navigate(['/auth/verify-otp'], {
        queryParams: { phone: payload.phone },
      });
    });
  }
}
