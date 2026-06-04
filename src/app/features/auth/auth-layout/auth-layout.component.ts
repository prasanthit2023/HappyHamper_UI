import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bb-auth-layout',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="min-h-screen flex" style="background: var(--color-bg);">

      <!-- Left decorative panel (desktop) -->
      <div class="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
           style="background: var(--gradient-primary);">
        <!-- Decorative circles -->
        <div class="absolute top-0 left-0 w-72 h-72 rounded-full -translate-x-1/2 -translate-y-1/2" style="background: rgba(255,255,255,0.06);"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 rounded-full translate-x-1/2 translate-y-1/2" style="background: rgba(255,255,255,0.04);"></div>
        <div class="absolute top-1/2 left-1/4 w-32 h-32 rounded-full -translate-y-1/2" style="background: rgba(255,255,255,0.05);"></div>

        <div class="relative z-10 text-center text-white max-w-sm">
          <!-- Brand mark -->
          <div class="w-20 h-20 rounded-2xl mx-auto mb-8 overflow-hidden shadow-float border-2 border-white/25">
            <img src="/logo.jpg" alt="Happy Hamper Logo" class="w-full h-full object-cover" />
          </div>

          <h2 class="font-display text-4xl font-black mb-4 leading-tight">
            Little Ones<br/>Deserve the Best
          </h2>
          <p class="text-white/80 text-lg leading-relaxed mb-10">
            Premium organic clothing crafted with love for your precious baby.
          </p>

          <div class="grid grid-cols-3 gap-4 text-center">
            @for (stat of stats; track stat.label) {
              <div class="rounded-2xl py-4 px-2" style="background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.15);">
                <div class="font-bold text-2xl mb-0.5">{{ stat.value }}</div>
                <div class="text-white/70 text-xs leading-tight">{{ stat.label }}</div>
              </div>
            }
          </div>

          <!-- Trust indicators -->
          <div class="flex items-center justify-center gap-4 mt-10">
            @for (t of trustItems; track t) {
              <div class="flex items-center gap-1.5 text-sm text-white/80">
                <svg class="w-4 h-4 text-white/90" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                {{ t }}
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Right: form panel -->
      <div class="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div class="w-full max-w-md">
          <!-- Logo (mobile only) -->
          <a routerLink="/" class="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div class="w-10 h-10 rounded-xl overflow-hidden shadow-warm">
              <img src="/logo.jpg" alt="Happy Hamper Logo" class="w-full h-full object-cover" />
            </div>
            <span class="font-display font-bold text-xl" style="color: #2D2D2D;">Happy Hamper</span>
          </a>

          <div class="card p-8 shadow-float">
            <router-outlet />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {
  stats = [
    { value: '50K+', label: 'Happy Customers' },
    { value: '500+', label: 'Products' },
    { value: '4.9', label: 'Rating' },
  ];

  trustItems = ['Organic', 'Safe', 'Trusted'];
}
