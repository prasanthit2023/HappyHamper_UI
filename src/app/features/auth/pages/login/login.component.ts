import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
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
    <div class="animate-slide-up">
      <div class="text-center mb-8">
        <h1 class="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">Welcome back!</h1>
        <p class="text-neutral-500">Sign in to your Happy Hamper account</p>
      </div>

      <!-- Google Sign-In -->
      <button
        (click)="authStore.loginWithGoogle()"
        type="button"
        class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all duration-200 mb-6"
        id="google-signin-btn"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <!-- Divider -->
      <div class="flex items-center gap-4 mb-6">
        <div class="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
        <span class="text-xs text-neutral-400">or sign in with email</span>
        <div class="flex-1 h-px bg-neutral-200 dark:bg-neutral-700"></div>
      </div>

      <!-- Login Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Error -->
        @if (authStore.error()) {
          <div class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in" role="alert">
            {{ authStore.error() }}
          </div>
        }

        <div>
          <label for="email" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Email</label>
          <input id="email" type="email" formControlName="email" placeholder="your@email.com"
                 class="input-field" autocomplete="email"
                 [class.border-red-400]="form.get('email')?.invalid && form.get('email')?.touched" />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <p class="text-red-500 text-xs mt-1">Please enter a valid email.</p>
          }
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label for="password" class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
            <a routerLink="/auth/forgot-password" class="text-xs text-primary-500 hover:text-primary-600 font-medium">Forgot password?</a>
          </div>
          <div class="relative">
            <input
              id="password"
              [type]="showPassword ? 'text' : 'password'"
              formControlName="password"
              placeholder="••••••••"
              class="input-field pr-10"
              autocomplete="current-password"
              [class.border-red-400]="form.get('password')?.invalid && form.get('password')?.touched"
            />
            <button type="button" (click)="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              @if (showPassword) {
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              } @else {
                <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              }
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary w-full py-3.5 text-base" [disabled]="form.invalid || authStore.loading()" id="login-submit-btn">
          @if (authStore.loading()) {
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Signing in...
          } @else {
            Sign In
          }
        </button>
      </form>

      <p class="text-center text-sm text-neutral-500 mt-6">
        Don't have an account?
        <a routerLink="/auth/register" class="text-primary-500 font-semibold hover:text-primary-600">Create one free →</a>
      </p>
    </div>
  `,
})
export class LoginComponent {
  readonly authStore = inject(AuthStore);
  private fb         = inject(FormBuilder);
  private router     = inject(Router);

  showPassword = false;

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { email, password } = this.form.value;
    this.authStore.login(email!, password!).subscribe((res) => {
      if (res) {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/';
        this.router.navigateByUrl(returnUrl);
      }
    });
  }
}
