import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signal, computed } from '@angular/core';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WishlistStore {
  readonly items    = signal<string[]>([]); // Array of product IDs
  readonly loading  = signal(false);

  readonly count = computed(() => this.items().length);

  constructor(private http: HttpClient) {}

  loadWishlist() {
    return this.http.get<{ data: { products: any[] } }>(`${environment.apiUrl}/wishlist`).pipe(
      tap((res) => {
        this.items.set(res.data.products.map((p) => p.id || p._id || p));
      }),
    );
  }

  toggle(productId: string) {
    const inWishlist = this.items().includes(productId);
    // Optimistic
    if (inWishlist) {
      this.items.update((ids) => ids.filter((id) => id !== productId));
    } else {
      this.items.update((ids) => [...ids, productId]);
    }

    return this.http
      .post<{ data: { inWishlist: boolean } }>(`${environment.apiUrl}/wishlist/${productId}/toggle`, {})
      .pipe(
        tap((res) => {
          const hasInWishlist = res.data?.inWishlist;
          // Sync with server response
          if (hasInWishlist && !this.items().includes(productId)) {
            this.items.update((ids) => [...ids, productId]);
          } else if (!hasInWishlist) {
            this.items.update((ids) => ids.filter((id) => id !== productId));
          }
        }),
      );
  }

  isInWishlist(productId: string): boolean {
    return this.items().includes(productId);
  }
}
