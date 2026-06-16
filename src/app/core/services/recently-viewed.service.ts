import { Injectable, PLATFORM_ID, Inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'bb_recently_viewed';
const MAX_ITEMS = 10;

export interface RecentProduct {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  price: number;
  discountPrice?: number;
  rating?: number;
}

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  readonly items = signal<RecentProduct[]>([]);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
    }
  }

  add(product: RecentProduct) {
    if (!isPlatformBrowser(this.platformId)) return;
    const current = this.items();
    const filtered = current.filter(p => p._id !== product._id);
    const updated = [product, ...filtered].slice(0, MAX_ITEMS);
    this.items.set(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.items.set(JSON.parse(raw));
    } catch { }
  }

  getAll(): RecentProduct[] {
    return this.items();
  }
}
