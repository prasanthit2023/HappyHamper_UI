import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'bb-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none" aria-live="polite" aria-label="Notifications">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-lg border animate-slide-up"
          [style]="getStyle(toast.type)"
          role="alert"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center" [style]="getIconBg(toast.type)">
            @if (toast.type === 'success') {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            } @else if (toast.type === 'error') {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            } @else if (toast.type === 'warning') {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            } @else {
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            }
          </div>
          <!-- Message -->
          <p class="flex-1 text-sm font-medium leading-relaxed pt-0.5">{{ toast.message }}</p>
          <!-- Close -->
          <button 
            (click)="toastService.remove(toast.id)"
            class="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
            [style]="getCloseStyle(toast.type)"
            aria-label="Dismiss notification"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  getStyle(type: string): string {
    const styles: Record<string, string> = {
      success: 'background: #F0FDF4; border-color: #86EFAC; color: #15803D;',
      error:   'background: #FEF2F2; border-color: #FCA5A5; color: #DC2626;',
      warning: 'background: #FFFBEB; border-color: #FCD34D; color: #B45309;',
      info:    'background: #F0F1FA; border-color: #7C83C3; color: #5B61A1;',
    };
    return styles[type] || styles['info'];
  }

  getIconBg(type: string): string {
    const styles: Record<string, string> = {
      success: 'background: #DCFCE7; color: #16A34A;',
      error:   'background: #FEE2E2; color: #DC2626;',
      warning: 'background: #FEF3C7; color: #D97706;',
      info:    'background: var(--color-primary-light); color: var(--color-primary);',
    };
    return styles[type] || styles['info'];
  }

  getCloseStyle(type: string): string {
    const styles: Record<string, string> = {
      success: 'color: #15803D;',
      error:   'color: #DC2626;',
      warning: 'color: #B45309;',
      info:    'color: var(--color-primary);',
    };
    return styles[type] || styles['info'];
  }
}
