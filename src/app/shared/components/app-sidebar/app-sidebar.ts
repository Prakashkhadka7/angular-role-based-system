import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NavigationItem } from '../../../core/models/auth.model';
import { Role } from '../../../core/models/role.model';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
interface MenuItem {
  label: string;
  icon: string;
  route: string;
  requiredPermissions?: string[];
}
@Component({
  selector: 'app-sidebar',
  imports: [
    MatIconModule,
    MatListModule,
    RouterModule,
    CommonModule,
    MatRippleModule,
  ],
  templateUrl: './app-sidebar.html',
  styleUrl: './app-sidebar.scss'
})
export class AppSidebar {
  @Output() toggleSidenav = new EventEmitter<void>();

  currentUser$: Observable<any>;
  currentUser: any = null;

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'User Management',
      icon: 'people',
      route: '/users',
      requiredPermissions: ['VIEW_USERS']
    },
    {
      label: 'Role Management',
      icon: 'security',
      route: '/roles',
      requiredPermissions: ['VIEW_ROLES']
    }
  ];

  constructor(
    private authStateService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authStateService.currentUser$;
  }

  ngOnInit() {
    this.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  hasPermission(requiredPermissions?: string[]): boolean {
    if (!requiredPermissions || !this.currentUser) return true;
    
    const userPermissions = this.currentUser.role?.permissions || [];
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  }

  navigate(route: string) {
    this.router.navigate([route]);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  onToggleSidenav() {
    this.toggleSidenav.emit();
  }
}