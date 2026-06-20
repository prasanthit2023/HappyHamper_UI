import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'bb-confirm-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (confirmService.activeConfirm(); as confirm) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-[10000] animate-fade-in flex items-center justify-center p-4"
        style="background: rgba(45,45,45,0.4); backdrop-filter: blur(2px);"
        (click)="confirmService.resolve(false)"
      >
        <!-- Modal Card -->
        <div
          class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 max-w-md w-full overflow-hidden transform scale-100 animate-scale-in pointer-events-auto"
          (click)="$event.stopPropagation()"
          role="dialog"
          aria-modal="true"
        >


          <div class="p-6 space-y-6">
            <div class="flex items-start gap-4">
              <!-- Icon based on type -->
              <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" [ngClass]="getIconBgClass(confirm.type)">
                @if (confirm.type === 'danger') {
                  <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                } @else if (confirm.type === 'warning') {
                  <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                }
              </div>

              <div class="flex-1 space-y-1">
                <h3 class="font-display font-bold text-base text-neutral-900 dark:text-white leading-tight">
                  {{ confirm.title }}
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {{ confirm.message }}
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end gap-2.5 pt-2">
              <button
                (click)="confirmService.resolve(false)"
                class="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
              >
                {{ confirm.cancelLabel }}
              </button>
              <button
                (click)="confirmService.resolve(true)"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all active:scale-95"
                [ngClass]="getConfirmBtnClass(confirm.type)"
              >
                {{ confirm.confirmLabel }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  readonly confirmService = inject(ConfirmService);

  getThemeBarClass(type: string): string {
    const classes: Record<string, string> = {
      danger: 'bg-red-500',
      warning: 'bg-amber-500',
      info: 'bg-blue-500'
    };
    return classes[type] || classes['warning'];
  }

  getIconBgClass(type: string): string {
    const classes: Record<string, string> = {
      danger: 'bg-red-50 dark:bg-red-950/20',
      warning: 'bg-amber-50 dark:bg-amber-950/20',
      info: 'bg-blue-50 dark:bg-blue-950/20'
    };
    return classes[type] || classes['warning'];
  }

  getConfirmBtnClass(type: string): string {
    const classes: Record<string, string> = {
      danger: 'bg-red-600 hover:bg-red-700 shadow-red-100 dark:shadow-none',
      warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100 dark:shadow-none',
      info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 dark:shadow-none'
    };
    return classes[type] || classes['warning'];
  }
}
