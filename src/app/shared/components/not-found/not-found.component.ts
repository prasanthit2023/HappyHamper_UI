import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'bb-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-neutral-950 dark:to-neutral-900 px-4">
      <div class="text-center max-w-lg animate-slide-up">
        <div class="text-[100px] text-primary-500 mb-6 flex justify-center">
          <i class="pi pi-exclamation-circle animate-bounce-soft"></i>
        </div>
        <h1 class="font-display text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-rose-soft mb-4">404</h1>
        <h2 class="text-2xl font-bold text-neutral-800 dark:text-white mb-3">Oops! Page not found</h2>
        <p class="text-neutral-500 mb-8">The page you're looking for seems to have wandered off. Let's get you back on track!</p>
        <div class="flex gap-4 justify-center">
          <a routerLink="/" class="btn-primary px-8 py-3">Go Home</a>
          <a routerLink="/products" class="btn-secondary px-8 py-3">Shop Now</a>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
