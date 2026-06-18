import { Injectable, PLATFORM_ID, Inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { HydrationService } from '../core/services/hydration.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  phone: string;
  addresses?: any[];
  isVerified: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly TOKEN_KEY = 'bb_access_token';
  private readonly REFRESH_TOKEN_KEY = 'bb_refresh_token';

  // ── Hydration ─────────────────────────────────────────
  readonly isHydrating = this.hydrationService.isHydrating;
  readonly hydrationComplete = this.hydrationService.hydrationComplete;

  // ── Signals ──────────────────────────────────────────
  readonly user    = signal<User | null>(null);
  readonly token   = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  // ── Computed ──────────────────────────────────────────
  readonly isLoggedIn   = computed(() => !!this.user() && !!this.token());
  readonly isAdmin      = computed(() => ['admin', 'superadmin'].includes(this.user()?.role ?? ''));
  readonly fullName     = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private readonly hydrationService: HydrationService,
  ) {
    this.hydrationService.isHydrating.set(true);
    this.hydrate();
  }

  // ── Login ─────────────────────────────────────────────
  login(phone: string, password: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .post<{ data: { accessToken: string; refreshToken: string; user: User } }>(
        `${environment.apiUrl}/auth/login`,
        { phone, password },
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          this.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Login failed');
          return of(null);
        }),
      );
  }

  // ── Phone Login & WhatsApp OTP ─────────────────────────
  sendPhoneOtp(phone: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .post<{ success: boolean; data: { message: string; otp?: string } }>(`${environment.apiUrl}/auth/phone-login`, { phone })
      .pipe(
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Failed to send OTP');
          return of(null);
        }),
      );
  }

  verifyPhoneOtp(phone: string, otp: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .post<{ data: { accessToken: string; refreshToken: string; user: User } }>(
        `${environment.apiUrl}/auth/phone-verify`,
        { phone, otp },
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          this.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'OTP verification failed');
          return of(null);
        }),
      );
  }

  // ── Register ──────────────────────────────────────────
  register(data: any) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .post<{ message: string; data?: unknown }>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Registration failed');
          return of(null);
        }),
      );
  }

  verifyOtp(phone: string, otp: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .post<{ message: string; data?: unknown }>(`${environment.apiUrl}/auth/verify-otp`, { phone, otp })
      .pipe(
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'OTP verification failed');
          return of(null);
        }),
      );
  }

  resendOtp(phone: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .post<{ message: string; data?: unknown }>(`${environment.apiUrl}/auth/resend-otp`, { phone })
      .pipe(
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Could not resend OTP');
          return of(null);
        }),
      );
  }

  // ── Google Login ──────────────────────────────────────
  loginWithGoogle() {
    if (isPlatformBrowser(this.platformId)) {
      globalThis.location.href = `${environment.apiUrl}/auth/google`;
    }
  }

  // ── Handle OAuth Callback ─────────────────────────────
  handleOAuthCallback(token: string, refreshToken?: string) {
    this.token.set(token);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
      }
    }
    return this.fetchProfile();
  }

  // ── Fetch Profile ─────────────────────────────────────
  fetchProfile() {
    return this.http.get<{ data: User }>(`${environment.apiUrl}/auth/me`).pipe(
      tap((res) => this.user.set(res.data)),
    );
  }

  // ── Refresh Token ─────────────────────────────────────
  // Uses stored refreshToken from localStorage (sent in request body)
  // Falls back to cookie-based refresh for backward compatibility
  refresh() {
    const storedRefreshToken = isPlatformBrowser(this.platformId)
      ? localStorage.getItem(this.REFRESH_TOKEN_KEY)
      : null;

    return this.http
      .post<{ data: { accessToken: string; refreshToken?: string } }>(
        `${environment.apiUrl}/auth/refresh`,
        storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          if (res?.data?.accessToken) {
            this.token.set(res.data.accessToken);
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem(this.TOKEN_KEY, res.data.accessToken);
              if (res.data.refreshToken) {
                localStorage.setItem(this.REFRESH_TOKEN_KEY, res.data.refreshToken);
              }
            }
          }
        }),
      );
  }

  // ── Logout ────────────────────────────────────────────
  logout() {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe();
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  // ── Silent sign-out (no navigation) ──────────────────
  // Used by the error interceptor to clear session without triggering navigation,
  // allowing guards to handle routing naturally.
  signOutSilent() {
    this.clearSession();
  }

  // ── Session Helpers ───────────────────────────────────
  private setSession(accessToken: string, refreshToken: string, user: User) {
    this.token.set(accessToken);
    this.user.set(user);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  private hydrate() {
    // Skip on SSR — browser APIs not available
    if (!isPlatformBrowser(this.platformId)) {
      console.log('[AuthStore] Hydration skipped (SSR server environment)');
      this.hydrationService.complete(false);
      return;
    }

    const accessToken = localStorage.getItem(this.TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    console.log('[AuthStore] Hydration started on browser. Tokens in localStorage:', {
      hasAccess: !!accessToken,
      hasRefresh: !!refreshToken,
    });

    if (accessToken) {
      // Try to use the access token first to avoid redundant refresh requests
      this.token.set(accessToken);
      console.log('[AuthStore] Access token found, calling fetchProfile...');
      this.fetchProfile().subscribe({
        next: (res) => {
          console.log('[AuthStore] fetchProfile succeeded during hydration:', res.data);
          this.hydrationService.complete(true);
        },
        error: (err) => {
          console.warn('[AuthStore] fetchProfile failed during hydration, triggering refresh:', err);
          // Token is invalid/expired — trigger refresh
          this.doRefreshAndProfile(refreshToken ?? undefined, accessToken);
        },
      });
    } else if (refreshToken) {
      console.log('[AuthStore] Only refresh token found, triggering refresh...');
      // No access token in storage, but we have a refresh token
      this.doRefreshAndProfile(refreshToken, undefined);
    } else {
      console.log('[AuthStore] No tokens found in localStorage. Hydration complete (false).');
      // No tokens at all — user needs to log in.
      this.hydrationService.complete(false);
    }
  }

  private doRefreshAndProfile(refreshToken?: string, fallbackAccessToken?: string) {
    console.log('[AuthStore] doRefreshAndProfile called with:', {
      hasRefresh: !!refreshToken,
      hasFallbackAccess: !!fallbackAccessToken,
    });
    // Call refresh directly with the token in the body if available.
    // If no token is provided, the backend can still accept the HttpOnly cookie.
    const body = refreshToken ? { refreshToken } : {};

    // Bypass the regular refresh() to avoid interceptor interference
    this.http
      .post<{ data: { accessToken: string; refreshToken?: string } }>(
        `${environment.apiUrl}/auth/refresh`,
        body,
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
          console.log('[AuthStore] refresh request succeeded during hydration:', res);
          if (res?.data?.accessToken) {
            const newToken = res.data.accessToken;
            this.token.set(newToken);
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem(this.TOKEN_KEY, newToken);
              if (res.data.refreshToken) {
                localStorage.setItem(this.REFRESH_TOKEN_KEY, res.data.refreshToken);
              }
            }
            // Fetch profile with the new token
            console.log('[AuthStore] Fetching profile with refreshed token...');
            this.fetchProfile().subscribe({
              next: (profileRes) => {
                console.log('[AuthStore] Refreshed profile succeeded:', profileRes.data);
                this.hydrationService.complete(true);
              },
              error: (err) => {
                console.error('[AuthStore] Refreshed profile failed:', err);
                this.clearSession();
                this.hydrationService.complete(false);
              },
            });
          } else if (fallbackAccessToken) {
            console.log('[AuthStore] Refresh did not return new token but fallback token exists. Trying fallback...');
            // If refresh did not return a new token but we still have a valid old one,
            // try using it before signing the user out.
            this.token.set(fallbackAccessToken);
            this.fetchProfile().subscribe({
              next: (profileRes) => {
                console.log('[AuthStore] Fallback profile succeeded:', profileRes.data);
                this.hydrationService.complete(true);
              },
              error: (err) => {
                console.error('[AuthStore] Fallback profile failed:', err);
                this.clearSession();
                this.hydrationService.complete(false);
              },
            });
          } else {
            console.warn('[AuthStore] Refresh succeeded but returned no token, and no fallback. Logging out.');
            this.clearSession();
            this.hydrationService.complete(false);
          }
        },
        error: (err) => {
          console.warn('[AuthStore] Refresh request failed during hydration:', err);
          if (fallbackAccessToken) {
            console.log('[AuthStore] Refresh failed. Trying fallback token...');
            this.token.set(fallbackAccessToken);
            this.fetchProfile().subscribe({
              next: (profileRes) => {
                console.log('[AuthStore] Fallback profile succeeded after refresh fail:', profileRes.data);
                this.hydrationService.complete(true);
              },
              error: (err2) => {
                console.error('[AuthStore] Fallback profile failed after refresh fail:', err2);
                this.clearSession();
                this.hydrationService.complete(false);
              },
            });
          } else {
            console.warn('[AuthStore] Refresh failed and no fallback token. Logging out.');
            // Refresh failed — session is truly expired
            this.clearSession();
            this.hydrationService.complete(false);
          }
        },
      });
  }

  updateProfile(data: any) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .patch<{ message: string; data: User }>(`${environment.apiUrl}/auth/profile`, data)
      .pipe(
        tap((res) => {
          this.user.set(res.data);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Profile update failed');
          return of(null);
        }),
      );
  }

  addAddress(address: any) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .post<{ message: string; data: any[] }>(`${environment.apiUrl}/auth/addresses`, address)
      .pipe(
        tap((res) => {
          this.user.update((u) => u ? { ...u, addresses: res.data } : null);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Failed to add address');
          return of(null);
        }),
      );
  }

  updateAddress(addressId: string, address: any) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .put<{ message: string; data: any[] }>(`${environment.apiUrl}/auth/addresses/${addressId}`, address)
      .pipe(
        tap((res) => {
          this.user.update((u) => u ? { ...u, addresses: res.data } : null);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Failed to update address');
          return of(null);
        }),
      );
  }

  deleteAddress(addressId: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .delete<{ message: string; data: any[] }>(`${environment.apiUrl}/auth/addresses/${addressId}`)
      .pipe(
        tap((res) => {
          this.user.update((u) => u ? { ...u, addresses: res.data } : null);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Failed to delete address');
          return of(null);
        }),
      );
  }

  setDefaultAddress(addressId: string) {
    this.loading.set(true);
    this.error.set(null);
    return this.http
      .patch<{ message: string; data: any[] }>(`${environment.apiUrl}/auth/addresses/${addressId}/default`, {})
      .pipe(
        tap((res) => {
          this.user.update((u) => u ? { ...u, addresses: res.data } : null);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Failed to set default address');
          return of(null);
        }),
      );
  }

  private clearSession() {
    this.token.set(null);
    this.user.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }
}
