import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'bb-verify-otp',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="animate-slide-up">
      <div class="text-center mb-8">
        <h1 class="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">Verify mobile number</h1>
        <p class="text-neutral-500">Enter the 6-digit OTP sent to your mobile via WhatsApp.</p>
      </div>

      @if (successMessage()) {
        <div class="bg-primary-50 border border-primary-200 text-primary px-4 py-3 rounded-xl text-sm mb-4">
          {{ successMessage() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        @if (authStore.error()) {
          <div class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {{ authStore.error() }}
          </div>
        }

        <div>
          <label for="phone" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Mobile Number</label>
          <input id="phone" type="tel" formControlName="phone" class="input-field" autocomplete="tel" />
          @if (isInvalid('phone')) {
            <p class="text-red-500 text-xs mt-1">Enter a valid mobile number.</p>
          }
        </div>

        <div>
          <label for="otp" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">OTP</label>
          <input id="otp" type="text" formControlName="otp" class="input-field text-center tracking-[0.4em] font-semibold" maxlength="6" inputmode="numeric" autocomplete="one-time-code" />
          @if (isInvalid('otp')) {
            <p class="text-red-500 text-xs mt-1">Enter the 6-digit OTP.</p>
          }
        </div>

        <button type="submit" class="btn-primary w-full py-3.5 text-base" [disabled]="form.invalid || authStore.loading()">
          @if (authStore.loading()) {
            <svg class="animate-spin w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Verifying...
          } @else {
            Verify Mobile Number
          }
        </button>
      </form>

      <button type="button" class="btn-ghost w-full mt-4" [disabled]="!form.value.phone || authStore.loading()" (click)="resendOtp()">
        Resend OTP
      </button>

      <p class="text-center text-sm text-neutral-500 mt-6">
        Already verified?
        <a routerLink="/auth/login" class="text-primary-500 font-semibold hover:text-primary-600">Sign in</a>
      </p>
    </div>
  `,
})
export class VerifyOtpComponent {
  readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly successMessage = signal('');

  form = this.fb.group({
    phone: [this.route.snapshot.queryParamMap.get('phone') || '', [Validators.required, Validators.pattern(/^\+?[1-9]\d{6,14}$/)]],
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
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

    const phone = this.form.value.phone!.trim();
    const otp = this.form.value.otp!.trim();

    this.authStore.verifyOtp(phone, otp).subscribe((result) => {
      if (!result) return;
      this.successMessage.set('Mobile number verified. Redirecting to sign in...');
      setTimeout(() => this.router.navigate(['/auth/login']), 800);
    });
  }

  resendOtp() {
    const phone = this.form.value.phone?.trim();
    if (!phone) return;

    this.authStore.resendOtp(phone).subscribe((result) => {
      if (!result) return;
      this.successMessage.set('A fresh OTP has been sent via WhatsApp.');
    });
  }
}
