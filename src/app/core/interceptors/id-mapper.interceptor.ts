import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

/**
 * Traverses an object or array recursively and clones it,
 * mapping 'id' keys to '_id' so the MongoDB-structured frontend
 * works flawlessly with the PostgreSQL/TypeORM backend responses.
 */
function mapIdKeys(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(mapIdKeys);
  }
  if (typeof obj === 'object') {
    const mapped: any = {};
    for (const key of Object.keys(obj)) {
      let val = obj[key];
      if (typeof val === 'object' && val !== null) {
        val = mapIdKeys(val);
      }
      mapped[key] = val;
    }
    
    // Map id to _id
    if (mapped.id !== undefined && mapped._id === undefined) {
      mapped._id = mapped.id;
    }
    
    // Also map _id to id if _id is present for complete compatibility
    if (mapped._id !== undefined && mapped.id === undefined) {
      mapped.id = mapped._id;
    }
    
    return mapped;
  }
  return obj;
}

export const idMapperInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body) {
        let body = event.body as any;

        // Unwrap NestJS TransformInterceptor standard wrapper if present
        if (body && typeof body === 'object' && body.success !== undefined && body.data !== undefined) {
          const innerData = body.data;
          if (
            innerData !== null &&
            typeof innerData === 'object' &&
            innerData.data !== undefined &&
            innerData.pagination !== undefined
          ) {
            body = {
              data: innerData.data,
              pagination: innerData.pagination,
            };
          } else {
            body = innerData;
          }
        }

        const mappedBody = mapIdKeys(body);
        console.log(`[IdMapperInterceptor] URL: ${req.url} | Original keys: ${body && typeof event.body === 'object' ? Object.keys(event.body).join(', ') : 'none'} | Mapped keys: ${mappedBody && typeof mappedBody === 'object' ? Object.keys(mappedBody).join(', ') : 'none'}`);
        return event.clone({ body: mappedBody });
      }
      return event;
    })
  );
};
