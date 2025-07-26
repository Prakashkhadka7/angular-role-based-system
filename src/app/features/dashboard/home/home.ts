import { Component } from '@angular/core';
import { Permission, Role } from '../../../core/models/role.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  currentUser: User | null = null;
  currentUserRole: Role | null = null;
  currentTime = new Date();
  
  // Statistics cards data
  statsCards = [
    {
      title: 'Welcome Back',
      icon: 'waving_hand',
      color: 'primary',
      description: 'Ready to manage your system'
    },
    {
      title: 'Your Role',
      icon: 'security',
      color: 'accent',
      description: 'Current permissions level'
    },
    {
      title: 'System Status',
      icon: 'check_circle',
      color: 'success',
      description: 'All systems operational'
    },
    {
      title: 'Last Login',
      icon: 'schedule',
      color: 'info',
      description: 'Session information'
    }
  ];

  // Quick actions based on permissions
  quickActions: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.setupQuickActions();
    
    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.currentUserRole = this.currentUser?.role || null;
  }

  private setupQuickActions(): void {
  const permissions = this.authService.getCurrentUser()?.permissions || [];
  this.quickActions = [];

  if (permissions.some((p:any)=> p.name === 'VIEW_USERS')) {
    this.quickActions.push({
      title: 'Manage Users',
      description: 'View and manage system users',
      icon: 'people',
      route: '/users',
      color: 'primary'
    });
  }

  if (permissions.some((p:Permission) => p.name === 'VIEW_ROLES')) {
    this.quickActions.push({
      title: 'Manage Roles',
      description: 'Configure roles and permissions',
      icon: 'admin_panel_settings',
      route: '/roles',
      color: 'accent'
    });
  }

  if (permissions.some(p => p.name === 'CREATE_USERS')) {
    this.quickActions.push({
      title: 'Add New User',
      description: 'Create a new system user',
      icon: 'person_add',
      route: '/users/create',
      color: 'success'
    });
  }

  if (permissions.some(p => p.name === 'CREATE_ROLES')) {
    this.quickActions.push({
      title: 'Create Role',
      description: 'Define new role with permissions',
      icon: 'add_moderator',
      route: '/roles/create',
      color: 'info'
    });
  }

  if (permissions.some(p => p.name === 'MANAGE_PROFILE')) {
    this.quickActions.push({
      title: 'My Profile',
      description: 'View your profile information',
      icon: 'account_circle',
      route: '/profile',
      color: 'default'
    });
  }
}

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  getPermissionCount(): number {
    return this.currentUserRole?.permissions?.length || 0;
  }

  hasPermission(permission: string){
    // return this.authService.hasPermission(permission) || false;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }
}