import { Injectable, signal } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly activeConfirm = signal<any | null>(null);

  confirm(options: ConfirmOptions): Observable<boolean> {
    const subject = new Subject<boolean>();
    this.activeConfirm.set({
      ...options,
      title: options.title || 'Are you sure?',
      confirmLabel: options.confirmLabel || 'Delete',
      cancelLabel: options.cancelLabel || 'Cancel',
      type: options.type || 'warning',
      subject
    });
    return subject.asObservable();
  }

  resolve(value: boolean) {
    const active = this.activeConfirm();
    if (active) {
      active.subject.next(value);
      active.subject.complete();
      this.activeConfirm.set(null);
    }
  }
}
