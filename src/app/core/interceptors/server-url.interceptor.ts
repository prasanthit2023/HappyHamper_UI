import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

/**
 * Prepend backend API host to relative API endpoints when executing on server-side rendering (SSR).
 * This ensures SSR can successfully resolve backend URLs (since server environment lacks browser hostname routing).
 */
export const serverUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId) && (req.url.startsWith('/') || !req.url.startsWith('http'))) {
    // Read backend URL from environment variables, fallback to local default
    const backendUrl = (typeof process !== 'undefined' && process.env ? process.env['BACKEND_URL'] || process.env['API_URL'] : null) || 'https://localhost:7226';
    
    // Clean up slash transitions (e.g. backendUrl = http://localhost:3000, req.url = /api/v1 => http://localhost:3000/api/v1)
    const normalizedUrl = req.url.startsWith('/') ? req.url : `/${req.url}`;
    const absoluteUrl = `${backendUrl.replace(/\/+$/, '')}${normalizedUrl}`;
    
    console.log(`[ServerUrlInterceptor] Transforming relative URL during SSR: ${req.url} -> ${absoluteUrl}`);

    const cloned = req.clone({
      url: absoluteUrl,
    });
    return next(cloned);
  }

  return next(req);
};
