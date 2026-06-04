import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

/** ThemeService — Dark mode removed. Light sandal theme is always active. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal(false);

  initTheme() {
    // Light-only mode — no dark theme
  }

  toggle() {
    // No-op — dark mode disabled
  }
}
