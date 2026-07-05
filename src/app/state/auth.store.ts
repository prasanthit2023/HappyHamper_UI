import { Injectable, PLATFORM_ID, Inject, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { HydrationService } from '../core/services/hydration.service';
import { PermissionStore } from './permission.store';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  roleId?: number | null;      // assigned via User Access Management
  roleName?: string | null;    // display name of the assigned role
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
  // isAdmin: true for superadmin/admin roles OR for any user who has been
  // assigned a custom role via User Access Management (roleId is set)
  readonly isAdmin      = computed(() => {
    const u = this.user();
    if (!u) return false;
    const roleStr = u.role?.toLowerCase() ?? '';
    if (['admin', 'superadmin'].includes(roleStr)) return true;
    // Staff user assigned a custom admin role (roleId 3 is Customer)
    if (u.roleId != null && u.roleId !== 3) return true;
    return false;
  });
  readonly isSuperAdmin = computed(() => this.user()?.role?.toLowerCase() === 'superadmin');
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
        `${environment.apiUrl}/login`,
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
      .post<{ success: boolean; data: { message: string; otp?: string } }>(`${environment.apiUrl}/phone-login`, { phone })
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
        `${environment.apiUrl}/phone-verify`,
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
      .post<{ message: string; data?: unknown }>(`${environment.apiUrl}/register`, data)
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
      .post<{ message: string; data?: unknown }>(`${environment.apiUrl}/verify-otp`, { phone, otp })
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
      .post<{ message: string; data?: unknown }>(`${environment.apiUrl}/resend-otp`, { phone })
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
      globalThis.location.href = `${environment.apiUrl}/google`;
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
    return this.http.get<{ data: User }>(`${environment.apiUrl}/me`).pipe(
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
        `${environment.apiUrl}/refresh`,
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
    this.http.post(`${environment.apiUrl}/logout`, {}, { withCredentials: true }).subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
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
      this.hydrationService.complete(false);
      return;
    }

    const accessToken = localStorage.getItem(this.TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (accessToken) {
      // Try to use the access token first to avoid redundant refresh requests
      this.token.set(accessToken);
      this.fetchProfile().subscribe({
        next: (res) => {
          this.hydrationService.complete(true);
        },
        error: (err) => {
          // Token is invalid/expired — trigger refresh
          this.doRefreshAndProfile(refreshToken ?? undefined, accessToken);
        },
      });
    } else if (refreshToken) {
      // No access token in storage, but we have a refresh token
      this.doRefreshAndProfile(refreshToken, undefined);
    } else {
      // No tokens at all — user needs to log in.
      this.hydrationService.complete(false);
    }
  }

  private doRefreshAndProfile(refreshToken?: string, fallbackAccessToken?: string) {
    // Call refresh directly with the token in the body if available.
    // If no token is provided, the backend can still accept the HttpOnly cookie.
    const body = refreshToken ? { refreshToken } : {};

    // Bypass the regular refresh() to avoid interceptor interference
    this.http
      .post<{ data: { accessToken: string; refreshToken?: string } }>(
        `${environment.apiUrl}/refresh`,
        body,
        { withCredentials: true },
      )
      .subscribe({
        next: (res) => {
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
            this.fetchProfile().subscribe({
              next: (profileRes) => {
                this.hydrationService.complete(true);
              },
              error: (err) => {
                this.clearSession();
                this.hydrationService.complete(false);
              },
            });
          } else if (fallbackAccessToken) {
            // If refresh did not return a new token but we still have a valid old one,
            // try using it before signing the user out.
            this.token.set(fallbackAccessToken);
            this.fetchProfile().subscribe({
              next: (profileRes) => {
                this.hydrationService.complete(true);
              },
              error: (err) => {
                this.clearSession();
                this.hydrationService.complete(false);
              },
            });
          } else {
            this.clearSession();
            this.hydrationService.complete(false);
          }
        },
        error: (err) => {
          if (fallbackAccessToken) {
            this.token.set(fallbackAccessToken);
            this.fetchProfile().subscribe({
              next: (profileRes) => {
                this.hydrationService.complete(true);
              },
              error: (err2) => {
                this.clearSession();
                this.hydrationService.complete(false);
              },
            });
          } else {
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
      .patch<{ message: string; data: User }>(`${environment.apiUrl}/profile`, data)
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
      .post<{ message: string; data: any[] }>(`${environment.apiUrl}/addresses`, address)
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
      .put<{ message: string; data: any[] }>(`${environment.apiUrl}/addresses/${addressId}`, address)
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
      .delete<{ message: string; data: any[] }>(`${environment.apiUrl}/addresses/${addressId}`)
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
      .patch<{ message: string; data: any[] }>(`${environment.apiUrl}/addresses/${addressId}/default`, {})
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
    // Clear cached permissions so the next login gets a fresh fetch
    try { inject(PermissionStore).clear(); } catch { /* not in injection context — skip */ }
  }
}
