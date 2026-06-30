import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../../../state/auth.store';

@Component({
  selector: 'bb-profile-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card p-6 space-y-6 page-enter max-w-xl mx-auto">
      <div class="border-b pb-4">
        <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">Profile Settings</h2>
        <p class="text-neutral-500 text-xs mt-1">Update your personal account details</p>
      </div>

      @if (successMessage()) {
        <div class="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-xl text-sm mb-4">
          {{ successMessage() }}
        </div>
      }

      @if (authStore.error()) {
        <div class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-4">
          {{ authStore.error() }}
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Avatar selection -->
        <div class="space-y-2">
          <label class="block text-xs font-semibold text-neutral-400">Choose Profile Avatar Color</label>
          <div class="flex gap-3">
            @for (av of avatars; track av) {
              <button
                type="button"
                (click)="selectAvatar(av)"
                [class.ring-2]="selectedAvatar() === av"
                [class.ring-primary-500]="selectedAvatar() === av"
                [class.ring-offset-2]="selectedAvatar() === av"
                [style.background]="av"
                class="w-12 h-12 rounded-full border border-neutral-200/50 flex items-center justify-center text-white text-base font-bold shadow-sm hover:scale-105 transition-transform"
              >
                {{ authStore.user()?.firstName?.charAt(0) || 'U' }}
              </button>
            }
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Full Name</label>
          <input type="text" formControlName="fullName" class="input-field py-2" placeholder="e.g. Priya Sharma" maxlength="100" />
          @if (form.get('fullName')?.invalid && form.get('fullName')?.touched) {
            <p class="text-red-500 text-[10px] mt-1">
              @if (form.get('fullName')?.errors?.['required']) {
                Full name is required.
              } @else if (form.get('fullName')?.errors?.['maxlength']) {
                Full name must be at most 100 characters.
              } @else if (form.get('fullName')?.errors?.['pattern']) {
                Full name must contain only letters and spaces (no special characters or numbers).
              }
            </p>
          }
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Phone Number</label>
          <input type="tel" formControlName="phone" class="input-field py-2" placeholder="+919876543210" />
          @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
            <p class="text-red-500 text-[10px] mt-1">Please enter a valid mobile number (e.g. +919876543210).</p>
          }
        </div>

        <div class="pt-4 border-t border-neutral-100 dark:border-neutral-700 flex justify-end">
          <button type="submit" [disabled]="form.invalid || authStore.loading()" class="btn-primary py-3 px-6 font-bold">
            @if (authStore.loading()) {
              Saving changes...
            } @else {
              Save Profile
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProfileEditComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  successMessage = signal<string>('');

  avatars = ['#7C83C3', '#A0958B', '#4F46E5', '#3B82F6', '#F59E0B', '#EF4444'];
  selectedAvatar = signal<string>('#7C83C3');

  form = this.fb.group({
    fullName: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z\s]+$/),
      ],
    ],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
  });

  ngOnInit() {
    const user = this.authStore.user();
    if (user) {
      const full = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '';
      this.form.patchValue({
        fullName: full,
        phone: user.phone || '',
      });
      if (user.avatar) {
        this.selectedAvatar.set(user.avatar);
      }
    }
  }

  selectAvatar(av: string) {
    this.selectedAvatar.set(av);
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.successMessage.set('');

    const payload = {
      fullName: this.form.value.fullName!.trim(),
      phone: this.form.value.phone!.trim(),
      avatar: this.selectedAvatar(),
    };

    this.authStore.updateProfile(payload).subscribe({
      next: (res) => {
        if (res) {
          this.successMessage.set('Profile information updated successfully.');
          this.cdr.markForCheck();
        }
      },
    });
  }
}
