import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { PermissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
    data: { title: 'Login' },
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/layout/main-layout/main-layout').then(
        (m) => m.MainLayout
      ),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/home/home').then((m) => m.Home),
        data: { title: 'Dashboard' },
      },
      {
        path: 'roles',
        canActivate: [PermissionGuard],
        data: { permission: 'VIEW_ROLES', title: 'Role Management' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/role-management/role-list/role-list').then(
                (m) => m.RoleList
              ),
          },
        ],
      },
      {
        path: 'users',
        canActivate: [PermissionGuard],
        data: { permission: 'VIEW_USERS', title: 'User Management' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/user-management/user-list/user-list').then(
                (m) => m.UserList
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import(
                './features/user-management/user-details/user-details'
              ).then((m) => m.UserDetails),
            data: { title: 'User Details' },
          },
        ],
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/dashboard/home/home').then((m) => m.Home),
        data: { title: 'My Profile' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];

