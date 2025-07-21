import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Home } from './features/dashboard/home/home';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayout } from './features/layout/main-layout/main-layout';

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
      //   {
      //     path: 'roles',
      //     canActivate: [PermissionGuard],
      //     data: { permission: 'VIEW_ROLES', title: 'Role Management' },
      //     children: [
      //       {
      //         path: '',
      //         component: RoleListComponent
      //       }
      //     ]
      //   },
      //   {
      //     path: 'users',
      //     canActivate: [PermissionGuard],
      //     data: { permission: 'VIEW_USERS', title: 'User Management' },
      //     children: [
      //       {
      //         path: '',
      //         component: UserListComponent
      //       },
      //       {
      //         path: ':id',
      //         component: UserDetailsComponent,
      //         data: { title: 'User Details' }
      //       }
      //     ]
      //   },
      {
        path: 'profile',
        component: Home,
        data: { title: 'My Profile' },
      },
    ],
  },

  // Wildcard route - must be last
//   {
//     path: '**',
//     redirectTo: '/dashboard',
//   },
];
