import { HttpInterceptorFn, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const userId = authService.getCurrentUser()?.id?.toString()  || '';

  if (token && !req.url.includes('/auth/')) {
    req = req.clone({
      setHeaders: {
        'Authorization': 'Bearer ' + token,
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    });
  }

  return next(req);
};
