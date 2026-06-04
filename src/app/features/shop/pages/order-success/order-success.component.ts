import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'bb-order-success',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bb-container py-16 page-enter max-w-md text-center">
      <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
        <svg class="w-10 h-10 animate-bounce-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>

      <h1 class="text-3xl font-extrabold text-neutral-900 dark:text-white font-display mb-2 leading-tight">
        Order Confirmed!
      </h1>
      <p class="text-neutral-500 text-sm mb-6 leading-relaxed">
        Thank you for shopping with Happy Hamper. Your order has been successfully placed.
      </p>

      <!-- Order number card -->
      <div class="card p-6 bg-neutral-50 dark:bg-neutral-800 border-none space-y-3 mb-8">
        <div>
          <span class="text-xs text-neutral-400 font-semibold block uppercase">Order Number</span>
          <span class="text-lg font-mono font-bold text-neutral-800 dark:text-neutral-255" id="success-order-number">
            {{ orderNumber() || 'HH-PENDING' }}
          </span>
        </div>
        <div class="border-t pt-3 text-xs text-neutral-400 leading-relaxed">
          We have sent a receipt email containing receipt details and order tracking links.
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a routerLink="/account/orders" class="btn-primary py-3 px-6 text-sm">
          Track My Orders
        </a>
        <a routerLink="/products" class="btn-secondary py-3 px-6 text-sm">
          Continue Shopping
        </a>
      </div>
    </div>
  `,
})
export class OrderSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  orderNumber = signal<string>('');

  ngOnInit() {
    this.orderNumber.set(this.route.snapshot.queryParamMap.get('orderNumber') || '');
  }
}
