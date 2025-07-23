import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Home } from './features/dashboard/home/home';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayout } from './features/layout/main-layout/main-layout';
import { PermissionGuard } from './core/guards/permission.guard';
import { RoleList } from './features/role-management/role-list/role-list';
import { UserList } from './features/user-management/user-list/user-list';
import { UserDetails } from './features/user-management/user-details/user-details';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
    data: { title: 'Login' },
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: Home,
        data: { title: 'Dashboard' },
      },
      {
        path: 'roles',
        canActivate: [PermissionGuard],
        data: { permission: 'VIEW_ROLES', title: 'Role Management' },
        children: [
          {
            path: '',
            component: RoleList,
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
            component: UserList,
          },
          {
            path: ':id',
            component: UserDetails,
            data: { title: 'User Details' },
          },
        ],
      },
      {
        path: 'profile',
        component: Home,
        data: { title: 'My Profile' },
      },
    ],
  },

  // Wildcard route 
    {
      path: '**',
      redirectTo: '/dashboard',
    },
];
