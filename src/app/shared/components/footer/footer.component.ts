import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'bb-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <footer class="pt-16 pb-8 mt-16" style="background: var(--color-bg-subtle); border-top: 1px solid var(--color-border);">
      <div class="bb-container">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          <!-- Brand Column -->
          <div class="lg:col-span-1">
            <a routerLink="/" class="flex items-center gap-2.5 mb-4">
              <div class="w-10 h-10 rounded-xl overflow-hidden shadow-warm group-hover:scale-105 transition-transform">
                <img src="/logo.jpg" alt="Happy Hamper Logo" class="w-full h-full object-cover" />
              </div>
              <span class="font-display font-bold text-xl" style="color: var(--color-text);">Happy Hamper</span>
            </a>
            <p class="text-sm leading-relaxed mb-6" style="color: var(--color-text-muted);">
              Premium clothing for your little ones. Soft, safe, and stylish — made with love for babies and kids aged 0–14 years.
            </p>
            <!-- Socials -->
            <div class="flex gap-3">
              @for (social of socials; track social.name) {
                <a [href]="social.href" [attr.aria-label]="social.name" target="_blank" rel="noopener"
                   class="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 social-link">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path [attr.d]="social.svgPath"/>
                  </svg>
                </a>
              }
            </div>
          </div>

          <!-- Shop Links -->
          <div>
            <h4 class="font-semibold mb-5 text-sm uppercase tracking-wider" style="color: var(--color-text);">Shop</h4>
            <ul class="space-y-3">
              @for (link of shopLinks; track link.label) {
                <li>
                  <a [routerLink]="link.path" [queryParams]="link.query"
                     class="text-sm transition-colors duration-200 flex items-center gap-2 footer-link">
                    <span class="w-1 h-1 rounded-full" style="background: var(--color-primary); opacity: 0.5;"></span>
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Customer Links -->
          <div>
            <h4 class="font-semibold mb-5 text-sm uppercase tracking-wider" style="color: var(--color-text);">Customer Care</h4>
            <ul class="space-y-3">
              @for (link of customerLinks; track link.label) {
                <li>
                  <a [routerLink]="link.path"
                     class="text-sm transition-colors duration-200 flex items-center gap-2 footer-link">
                    <span class="w-1 h-1 rounded-full" style="background: var(--color-primary); opacity: 0.5;"></span>
                    {{ link.label }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Newsletter -->
          <div>
            <h4 class="font-semibold mb-5 text-sm uppercase tracking-wider" style="color: var(--color-text);">Newsletter</h4>
            <p class="text-sm mb-4" style="color: var(--color-text-muted);">Get exclusive offers and new arrivals straight to your inbox.</p>
            <form (ngSubmit)="onSubscribe()" class="space-y-3">
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="your@email.com"
                class="newsletter-input w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              />
              <button type="submit" class="w-full btn-primary text-sm py-2.5">
                Subscribe
              </button>
            </form>
            @if (subscribed) {
              <p class="text-primary text-xs mt-2 animate-fade-in flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                You are successfully subscribed!
              </p>
            }

            <!-- Trust badges -->
            <div class="flex gap-3 mt-6">
              @for (trust of trustBadges; track trust.label) {
                <div class="flex flex-col items-center text-center flex-1 p-2.5 rounded-xl" style="background: white; border: 1px solid var(--color-border);">
                  <div class="mb-1.5">
                    <svg class="w-5 h-5 mx-auto" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="trust.svgPath"/>
                    </svg>
                  </div>
                  <span class="text-[10px] uppercase font-semibold" style="color: var(--color-text-muted); letter-spacing: 0.05em;">{{ trust.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Payment Methods + Copyright -->
        <div class="pt-8" style="border-top: 1px solid var(--color-border);">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p class="text-xs mb-2" style="color: var(--color-text-muted);">We accept</p>
              <div class="flex gap-2 flex-wrap">
                @for (method of paymentMethods; track method) {
                  <span class="px-3 py-1.5 rounded-lg text-xs font-medium" style="background: white; color: var(--color-text-muted); border: 1px solid var(--color-border);">{{ method }}</span>
                }
              </div>
            </div>
            <div class="text-xs text-center sm:text-right" style="color: var(--color-text-muted);">
              <p>© {{ currentYear }} Happy Hamper. All rights reserved.</p>
              <div class="flex gap-4 mt-1 justify-center sm:justify-end">
                <a routerLink="/privacy" class="hover:text-neutral-600 transition-colors">Privacy Policy</a>
                <a routerLink="/terms" class="hover:text-neutral-600 transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .social-link {
      background: white;
      color: var(--color-text-muted);
      border: 1px solid var(--color-border);
    }
    .social-link:hover {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    .footer-link {
      color: var(--color-text-muted);
    }
    .footer-link:hover {
      color: var(--color-primary);
    }
    .newsletter-input {
      background: white;
      border: 1px solid var(--color-border);
      color: var(--color-text);
    }
    .newsletter-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(46, 175, 176, 0.12);
    }
  `]
})
export class FooterComponent {
  email = '';
  subscribed = false;
  currentYear = new Date().getFullYear();

  socials = [
    { name: 'Instagram', href: '#', svgPath: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
    { name: 'Facebook', href: '#', svgPath: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
    { name: 'Twitter', href: '#', svgPath: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
    { name: 'YouTube', href: '#', svgPath: 'M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z' },
  ];

  shopLinks = [
    { label: 'New Arrivals',  path: '/products', query: { newArrival: true } },
    { label: 'Best Sellers',  path: '/products', query: { bestSeller: true } },
    { label: 'All Products',  path: '/products', query: null },
    { label: 'Offers & Deals', path: '/products', query: { onSale: true } },
    { label: 'Size Guide',    path: '/size-guide', query: null },
  ];

  customerLinks = [
    { label: 'My Account',    path: '/account/dashboard' },
    { label: 'Track Order',   path: '/account/orders' },
    { label: 'Return Policy', path: '/returns' },
    { label: 'FAQ',           path: '/faq' },
    { label: 'Contact Us',    path: '/contact' },
  ];

  trustBadges = [
    { label: 'SSL Secured',  svgPath: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { label: 'Easy Returns', svgPath: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { label: 'Fast Delivery', svgPath: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17h5m4 0h5' },
  ];

  paymentMethods = ['Visa', 'Mastercard', 'UPI', 'Razorpay', 'Net Banking', 'Cash on Delivery'];

  onSubscribe() {
    if (this.email.trim()) {
      this.subscribed = true;
      this.email = '';
      setTimeout(() => (this.subscribed = false), 5000);
    }
  }
}
