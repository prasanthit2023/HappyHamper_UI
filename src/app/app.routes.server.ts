import { ServerRoute, RenderMode } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Runtime SSR for public pages so production content stays dynamic.
  { path: '', renderMode: RenderMode.Server },
  { path: 'login', renderMode: RenderMode.Server },
  { path: 'register', renderMode: RenderMode.Server },

  // SSR for dynamic product/category pages.
  { path: 'products', renderMode: RenderMode.Server },
  { path: 'products/:slug', renderMode: RenderMode.Server },
  { path: 'category/:slug', renderMode: RenderMode.Server },
  { path: 'search', renderMode: RenderMode.Server },

  // Client-side render for authenticated areas
  { path: 'account/**', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'checkout/**', renderMode: RenderMode.Client },

  // Default to server rendering
  { path: '**', renderMode: RenderMode.Server },
];
