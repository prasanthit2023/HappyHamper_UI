import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'bb-notifications-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="card p-6 space-y-6 page-enter">
      <div class="flex items-center justify-between border-b pb-4">
        <div>
          <h2 class="font-bold text-xl text-neutral-900 dark:text-white font-display">Notifications</h2>
          <p class="text-neutral-500 text-xs mt-1">Stay updated on your orders and account alerts</p>
        </div>
        @if (notifications().length > 0) {
          <button
            (click)="markAllAsRead()"
            [disabled]="actionLoading()"
            class="btn-secondary text-xs py-2 px-4 font-bold"
          >
            Mark All Read
          </button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-4">
          <div class="skeleton h-16 w-full rounded-2xl"></div>
          <div class="skeleton h-16 w-full rounded-2xl"></div>
        </div>
      } @else if (notifications().length === 0) {
        <div class="text-center py-12 text-neutral-400 space-y-3">
          <div class="w-12 h-12 bg-neutral-50 dark:bg-neutral-800 text-neutral-300 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
          </div>
          <h4 class="font-bold text-sm text-neutral-750">No notifications</h4>
          <p class="text-xs max-w-xs mx-auto">You're all caught up! New alerts will show up here.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (notif of notifications(); track notif.id) {
            <div
              [class.bg-primary-50]="!notif.isRead"
              [class.border-l-primary-500]="!notif.isRead"
              [class.border-l-4]="!notif.isRead"
              [class.bg-white]="notif.isRead"
              class="border rounded-2xl p-4 flex justify-between items-start dark:bg-neutral-800 dark:border-neutral-700"
            >
              <div class="space-y-1 pr-4">
                <h4 class="font-bold text-sm" [class.text-neutral-900]="!notif.isRead" [class.text-neutral-750]="notif.isRead" [class.dark:text-white]="!notif.isRead">
                  {{ notif.title }}
                </h4>
                <p class="text-xs text-neutral-500 leading-relaxed">{{ notif.message }}</p>
                <span class="text-[10px] text-neutral-400 block pt-1">{{ notif.createdAt | date:'short' }}</span>
              </div>

              @if (!notif.isRead) {
                <button
                  (click)="markAsRead(notif.id)"
                  [disabled]="actionLoading()"
                  class="text-[10px] font-bold text-primary-500 hover:underline uppercase tracking-wider flex-shrink-0"
                >
                  Mark Read
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  notifications = signal<any[]>([]);
  loading = signal<boolean>(true);
  actionLoading = signal<boolean>(false);

  ngOnInit() {
    this.fetchNotifications();
  }

  fetchNotifications() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/notifications`).subscribe({
      next: (res) => {
        this.notifications.set(res.data || []);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  markAsRead(id: string) {
    this.actionLoading.set(true);
    this.http.patch<any>(`${environment.apiUrl}/notifications/${id}/read`, {}).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  markAllAsRead() {
    this.actionLoading.set(true);
    this.http.patch<any>(`${environment.apiUrl}/notifications/read-all`, {}).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.cdr.markForCheck();
      },
      error: () => {
        this.actionLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
