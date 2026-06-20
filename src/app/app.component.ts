import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmModalComponent } from './shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'bb-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, ConfirmModalComponent],
  template: `
    <router-outlet />
    <bb-toast />
    <bb-confirm-modal />
  `,
})
export class AppComponent {}
