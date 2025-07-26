import { Component } from '@angular/core';
import { RoleDeleteConfirm } from '../role-delete-confirm/role-delete-confirm';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Role } from '../../../core/models/role.model';
import { RoleService } from '../../../core/services/role.service';
import { RoleCreateEdit } from '../role-create-edit/role-create-edit';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { UserDeleteConfirm } from '../../user-management/user-delete-confirm/user-delete-confirm';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-role-list',
  imports: [
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    CommonModule,
  ],
  templateUrl: './role-list.html',
  styleUrl: './role-list.scss',
})
export class RoleList {
  private destroy$ = new Subject<void>();

  roles: Role[] = [];
  displayedColumns: string[] = [
    'name',
    'permissions',
    'isDefault',
    'createdAt',
    'actions',
  ];
  isLoading = true;

  constructor(
    private roleService: RoleService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.roleService.loadRoles().subscribe({
      next: (roles: Role[]) => {
        console.log('Roles loaded:', roles);
        this.roles = roles;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading roles:', error);
        this.isLoading = false;
        this.snackBar.open('Error loading roles', 'Close', { duration: 3000 });
      },
    });
  }

  createRole(): void {
    const dialogRef = this.dialog.open(RoleCreateEdit, {
      width: '600px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
      }
    });
  }

  editRole(role: Role): void {
    const dialogRef = this.dialog.open(RoleCreateEdit, {
      width: '600px',
      data: { mode: 'edit', role: role, isEdit: true },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadRoles();
      }
    });
  }

  deleteRole(role: Role): void {
    const dialogRef = this.dialog.open(UserDeleteConfirm, {
      width: '400px',
      data: { role: role },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.performDelete(role);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private performDelete(role: Role): void {
    this.roleService
      .deleteRole(role.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Role deleted successfully', 'Close', {
            duration: 3000,
          });
          this.loadRoles();
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          this.snackBar.open('Error deleting role', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  formatPermissions(permissions: string[]): string {
    return permissions.map((p) => p.replace('_', ' ')).join(', ');
  }

  formatData(role: Role) {
    return role?.name?.replace('_', ' ');
  }

  togglePermissions(role: any): void {
    role.showAllPermissions = !role.showAllPermissions;
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }
}