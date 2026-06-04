import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private api = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(params: any = {}) {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<any>(this.api, { params: httpParams });
  }

  getBySlug(slug: string) {
    return this.http.get<{ data: any }>(`${this.api}/${slug}`);
  }

  getFeatured(limit = 12) {
    return this.http.get<{ data: any[] }>(`${this.api}/featured`, { params: { limit } });
  }

  getBestSellers(limit = 12) {
    return this.http.get<{ data: any[] }>(`${this.api}/best-sellers`, { params: { limit } });
  }

  getNewArrivals(limit = 12) {
    return this.http.get<{ data: any[] }>(`${this.api}/new-arrivals`, { params: { limit } });
  }

  getRelated(productId: string, limit = 8) {
    return this.http.get<{ data: any[] }>(`${this.api}/${productId}/related`, { params: { limit } });
  }

  search(query: string, limit = 10) {
    return this.http.get<{ data: any[] }>(`${environment.apiUrl}/search`, { params: { q: query, limit } });
  }

  autocomplete(query: string) {
    return this.http.get<{ data: any[] }>(`${environment.apiUrl}/search/autocomplete`, { params: { q: query } });
  }
}
