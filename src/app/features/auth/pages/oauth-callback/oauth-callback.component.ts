import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { catchError, of, take } from 'rxjs';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'bb-oauth-callback',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="animate-slide-up text-center">
      <div
        class="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center"
      >
        @if (status() === 'loading') {
          <svg class="w-7 h-7 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        } @else if (status() === 'success') {
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        } @else {
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
      </div>

      <h1 class="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-2">
        {{ title() }}
      </h1>
      <p class="text-neutral-500 mb-6">{{ message() }}</p>

      @if (status() === 'error') {
        <button type="button" class="btn-primary w-full py-3.5" routerLink="/login">
          Back to Sign In
        </button>
      }
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  readonly status = signal<'loading' | 'success' | 'error'>('loading');
  readonly title = signal('Signing you in...');
  readonly message = signal('Please wait while we complete your login.');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');

    if (!token) {
      this.showError('Google sign-in did not return a valid session.');
      return;
    }

    this.authStore
      .handleOAuthCallback(token, refreshToken ?? undefined)
      .pipe(
        take(1),
        catchError(() => {
          this.showError('We could not complete Google sign-in. Please try again.');
          return of(null);
        }),
      )
      .subscribe((profile) => {
        if (!profile) return;

        this.status.set('success');
        this.title.set('Signed in');
        this.message.set('Redirecting you now...');

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const target = (!returnUrl || returnUrl === '/') ? '/products' : returnUrl;
        this.router.navigateByUrl(target);
      });
  }

  private showError(message: string) {
    this.status.set('error');
    this.title.set('Sign-in failed');
    this.message.set(message);
  }
}
