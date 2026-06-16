import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-forgot-password',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="animate-slide-up max-w-md mx-auto my-10 p-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-card border border-neutral-100 dark:border-neutral-700">
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-primary-50 dark:bg-primary-950/30 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        </div>
        <h1 class="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">Reset Password</h1>
        <p class="text-neutral-500 text-sm">Recover access to your Happy Hamper account</p>
      </div>

      @if (successMessage()) {
        <div class="bg-primary-50 border border-primary-200 text-primary px-4 py-3 rounded-xl text-sm mb-6">
          {{ successMessage() }}
        </div>
      }

      @if (errorMessage()) {
        <div class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
          {{ errorMessage() }}
        </div>
      }

      @if (step() === 1) {
        <!-- Step 1: Request OTP -->
        <form [formGroup]="requestForm" (ngSubmit)="onRequestOtp()" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email Address</label>
            <input id="email" type="email" formControlName="email" placeholder="your@email.com" class="input-field" autocomplete="email" />
            @if (requestForm.get('email')?.invalid && requestForm.get('email')?.touched) {
              <p class="text-red-500 text-xs mt-1">Please enter a valid email address.</p>
            }
          </div>

          <button type="submit" class="btn-primary w-full py-3.5 text-base" [disabled]="requestForm.invalid || loading()">
            @if (loading()) {
              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Sending OTP...
            } @else {
              Send Reset OTP
            }
          </button>
        </form>
      } @else {
        <!-- Step 2: Reset Password -->
        <form [formGroup]="resetForm" (ngSubmit)="onResetPassword()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email Address</label>
            <input type="email" [value]="requestForm.value.email" disabled class="input-field bg-neutral-50 cursor-not-allowed" />
          </div>

          <div>
            <label for="otp" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">OTP</label>
            <input id="otp" type="text" formControlName="otp" placeholder="6-Digit Code" class="input-field text-center tracking-widest font-semibold" maxlength="6" />
            @if (resetForm.get('otp')?.invalid && resetForm.get('otp')?.touched) {
              <p class="text-red-500 text-xs mt-1">Please enter the 6-digit OTP code.</p>
            }
          </div>

          <div>
            <label for="newPassword" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">New Password</label>
            <input id="newPassword" type="password" formControlName="newPassword" placeholder="Minimum 8 characters" class="input-field" />
            @if (resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched) {
              <p class="text-red-500 text-xs mt-1">Password must be at least 8 characters long.</p>
            }
          </div>

          <button type="submit" class="btn-primary w-full py-3.5 text-base" [disabled]="resetForm.invalid || loading()">
            @if (loading()) {
              <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Resetting password...
            } @else {
              Reset Password
            }
          </button>
        </form>
      }

      <p class="text-center text-sm text-neutral-500 mt-6">
        Remember your password?
        <a routerLink="/auth/login" class="text-primary-500 font-semibold hover:text-primary-600">Sign in</a>
      </p>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  step = signal<number>(1);
  loading = signal<boolean>(false);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  requestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  onRequestOtp() {
    if (this.requestForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const email = this.requestForm.value.email!.trim();

    this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set('A reset code has been sent to your email.');
        this.step.set(2);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to request reset OTP.');
      },
    });
  }

  onResetPassword() {
    if (this.resetForm.invalid) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const email = this.requestForm.value.email!.trim();
    const otp = this.resetForm.value.otp!.trim();
    const newPassword = this.resetForm.value.newPassword!;

    this.http.post<any>(`${environment.apiUrl}/auth/reset-password`, { email, otp, newPassword }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set('Password reset successful. Redirecting to sign in...');
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to reset password. Please check your OTP.');
      },
    });
  }
}
