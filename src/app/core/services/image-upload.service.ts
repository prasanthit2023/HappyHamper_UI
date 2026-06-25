import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private http = inject(HttpClient);
  private allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  private maxSizeBytes = 5 * 1024 * 1024; // 5MB

  uploadMultiple(files: FileList | File[], folder: string = 'products'): Observable<any> {
    if (!files || files.length === 0) {
      return throwError(() => new Error('No files selected.'));
    }

    const formData = new FormData();
    const filesArray = Array.from(files);

    for (const file of filesArray) {
      // Client-side validation
      if (!this.allowedTypes.includes(file.type)) {
        return throwError(() => new Error(`File type '${file.type}' is not supported. Supported: JPG, PNG, GIF, WebP, SVG`));
      }
      if (file.size > this.maxSizeBytes) {
        return throwError(() => new Error(`File '${file.name}' exceeds the 5MB size limit.`));
      }
      formData.append('files', file);
    }

    return this.http.post<any>(`${environment.apiUrl}/upload/multiple?folder=${folder}`, formData);
  }
}
