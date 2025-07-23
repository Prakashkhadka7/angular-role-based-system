import { Injectable } from '@angular/core';
import { Observable, map, combineLatest } from 'rxjs';
import { AuthService } from './auth.service';
import { ResourceType, ActionType, Permission } from '../models/role.model';
import { NavigationItem } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  constructor(private authService: AuthService) {}

  hasPermission(argPermission: any): Observable<boolean> {
    return this.authService.permissions$.pipe(
      map((permissions) => {
        if (!permissions || permissions.length === 0) {
          return false;
        }

        return permissions.some((permission: Permission) =>
          typeof argPermission === 'string'
            ? permission.name === argPermission
            : permission.name === argPermission.name
        );
      })
    );
  }

  hasAnyPermission(
    requiredPermissions: { resource: ResourceType; action: ActionType }[]
  ): Observable<boolean> {
    return combineLatest(
      requiredPermissions.map((perm) => this.hasPermission(perm))
    ).pipe(map((results) => results.some((hasPermission) => hasPermission)));
  }

  canManageUsers(): Observable<boolean> {
    return this.hasPermission({
      resource: ResourceType.USERS,
      action: ActionType.READ,
      id: 0,
      name: '',
      description: '',
      category: ''
    });
  }

  canManageRoles(): Observable<boolean> {
    return this.hasPermission({
      resource: ResourceType.ROLES,
      action: ActionType.READ,
      id: 0,
      name: '',
      description: '',
      category: ''
    });
  }

  canCreateUser(): Observable<boolean> {
    return this.hasPermission({
      resource: ResourceType.USERS,
      action: ActionType.CREATE,
      id: 0,
      name: '',
      description: '',
      category: ''
    });
  }

  canEditUser(): Observable<boolean> {
    return this.hasPermission({
      resource: ResourceType.USERS,
      action: ActionType.UPDATE,
      id: 0,
      name: '',
      description: '',
      category: ''
    });
  }

  canDeleteUser(): Observable<boolean> {
    return this.hasPermission({
      resource: ResourceType.USERS,
      action: ActionType.DELETE,
      id: 0,
      name: '',
      description: '',
      category: ''
    });
  }

  canCreateRole(): Observable<boolean> {
    return this.hasPermission({
      resource: ResourceType.ROLES,
      action: ActionType.CREATE,
      id: 0,
      name: '',
      description: '',
      category: ''
    });
  }

  canEditRole(): Observable<boolean> {
    return this.hasPermission({
      resource: ResourceType.ROLES,
      action: ActionType.UPDATE,
      id: 0,
      name: '',
      description: '',
      category: ''
    });
  }

  canDeleteRole(): Observable<boolean> {
    return this.hasPermission({
      resource: ResourceType.ROLES,
      action: ActionType.DELETE,
      id: 0,
      name: '',
      description: '',
      category: ''
    });
  }

  getNavigationItems(): Observable<NavigationItem[]> {
    const baseItems: NavigationItem[] = [
      {
        label: 'Dashboard',
        route: '/dashboard',
        icon: 'dashboard',
      },
      {
        label: 'User Management',
        route: '/users',
        icon: 'people',
        permission: {
          resource: ResourceType.USERS, action: ActionType.READ,
          id: 0,
          name: '',
          description: '',
          category: ''
        },
      },
      {
        label: 'Role Management',
        route: '/roles',
        icon: 'admin_panel_settings',
        permission: {
          resource: ResourceType.ROLES, action: ActionType.READ,
          id: 0,
          name: '',
          description: '',
          category: ''
        },
      },
    ];
    return combineLatest(
      baseItems.map((item) => {
        if (!item.permission) {
          return new Observable<NavigationItem>((observer) =>
            observer.next({ ...item, visible: true })
          );
        }
        return this.hasPermission(item.permission).pipe(
          map(
            (hasPermission) =>
              ({ ...item, visible: hasPermission } as NavigationItem)
          )
        );
      })
    ).pipe(
      map((items: NavigationItem[]) => items.filter((item) => item.visible))
    );
  }
}
