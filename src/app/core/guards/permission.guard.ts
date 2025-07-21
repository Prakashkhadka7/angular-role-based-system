import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { PermissionService } from '../services/permission.service';
import { ResourceType, ActionType, Permission } from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredPermission = route.data['permission'] as Permission;
    
    if (!requiredPermission) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }

    return this.permissionService.hasPermission(requiredPermission).pipe(
      take(1),
      map(hasPermission => {
        if (!hasPermission) {
          this.router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
    );
  }
}