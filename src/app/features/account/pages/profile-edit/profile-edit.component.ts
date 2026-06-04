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
        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
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

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">First Name</label>
            <input type="text" formControlName="firstName" class="input-field py-2" />
            @if (form.get('firstName')?.invalid && form.get('firstName')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">First name is required.</p>
            }
          </div>

          <div>
            <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Last Name</label>
            <input type="text" formControlName="lastName" class="input-field py-2" />
            @if (form.get('lastName')?.invalid && form.get('lastName')?.touched) {
              <p class="text-red-500 text-[10px] mt-1">Last name is required.</p>
            }
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Email Address</label>
          <input type="email" [value]="authStore.user()?.email" disabled class="input-field py-2 bg-neutral-50 dark:bg-neutral-800 cursor-not-allowed text-neutral-400" />
          <p class="text-[10px] text-neutral-400 mt-1">Contact support to change your account email.</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-400 mb-1.5">Phone Number</label>
          <input type="tel" formControlName="phone" class="input-field py-2" placeholder="+919876543210" />
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

  avatars = ['#4F46E5', '#3B82F6', '#0D9488', '#10B981', '#F59E0B', '#EF4444'];
  selectedAvatar = signal<string>('#4F46E5');

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    phone: [''],
  });

  ngOnInit() {
    const user = this.authStore.user();
    if (user) {
      this.form.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
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
      firstName: this.form.value.firstName!.trim(),
      lastName: this.form.value.lastName!.trim(),
      phone: this.form.value.phone?.trim() || '',
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
