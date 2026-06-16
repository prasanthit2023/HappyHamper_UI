import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HydrationService {
  readonly isHydrating = signal(false);
  private hydrationResolve?: (value: boolean) => void;
  readonly hydrationComplete = new Promise<boolean>((resolve) => {
    this.hydrationResolve = resolve;
  });

  complete(isLoggedIn: boolean) {
    this.isHydrating.set(false);
    this.hydrationResolve?.(isLoggedIn);
  }
}
