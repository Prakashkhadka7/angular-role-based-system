import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Role } from '../../../core/models/role.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';
import { UserService } from '../../../core/services/user.service';
import { UserDeleteConfirm } from '../user-delete-confirm/user-delete-confirm';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { UserCreateEdit } from '../user-create-edit/user-create-edit';


@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSelectModule,
    FormsModule,
    MatTooltipModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.scss'
})
export class UserList {
private destroy$ = new Subject<void>();
  
  users: User[] = [];
  roles: Role[] = [];
  filteredUsers: User[] = [];
  loading = false;
  searchTerm = '';
  selectedRoleFilter = '';
  currentUser: User | null = null;

  displayedColumns: string[] = [
    'id', 
    'fullName', 
    'username', 
    'email', 
    'role', 
    'isActive', 
    'createdAt', 
    'actions'
  ];

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.loadUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  loadRoles(): void {
    this.roleService.loadRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles;
        },
        error: (error) => {
          console.error('Error loading roles:', error);
        }
      });
  }


  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        user.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.selectedRoleFilter || 
        user.roleId.toString() === this.selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onRoleFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRoleFilter = '';
    this.applyFilters();
  }

  getRoleName(roleId: string): string {
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown';
  }

  canCreateUser(): Observable<boolean> {
    return this.authService.hasPermission('CREATE_USER');
  }

  canEditUser(): Observable<boolean> {
    return this.authService.hasPermission('EDIT_USER');
  }

  canDeleteUser(): Observable<boolean> {
    return this.authService.hasPermission('DELETE_USER');
  }

  canViewUserDetails(): Observable<boolean> {
    return this.authService.hasPermission('VIEW_USERS');
  }

  createUser(): void {
    const dialogRef = this.dialog.open(UserCreateEdit, {
      width: '1200px',
      data: { isEditMode: false }
    });

    dialogRef.afterClosed().subscribe((result: User) => {
      if (result) {
        this.refresh();
      }
    });
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(UserCreateEdit, {
      width: '1200px',
      data: { isEditMode: true, user }
    });

    dialogRef.afterClosed().subscribe((result: User) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  viewUser(user: User): void {
    this.router.navigate(['/users/details', user.id]);
  }

  deleteUser(user: User): void {
    if (this.currentUser && user.id === this.currentUser.id) {
      this.snackBar.open('You cannot delete your own account', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(UserDeleteConfirm, {
      width: '400px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performDelete(user);
      }
    });
  }

  private performDelete(user: User): void {
    this.userService.deleteUser(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.snackBar.open('Error deleting user', 'Close', { duration: 3000 });
        }
      });
  }

  toggleUserStatus(user: User): void {
    const updatedUser = { ...user, isActive: !user.isActive };
    
    this.userService.updateUser(user.id, updatedUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const status = updatedUser.isActive ? 'activated' : 'deactivated';
          this.snackBar.open(`User ${status} successfully`, 'Close', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.snackBar.open('Error updating user status', 'Close', { duration: 3000 });
        }
      });
  }

  refresh(): void {
    this.loadUsers();
  }
}