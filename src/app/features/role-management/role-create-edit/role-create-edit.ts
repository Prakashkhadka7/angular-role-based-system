import { Component, Inject } from '@angular/core';
import { Permission, Role } from '../../../core/models/role.model';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleService } from '../../../core/services/role.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// export interface Permission {
//   id: number;
//   name: string;
//   description: string;
// }

// export interface Role {
//   id?: number;
//   name: string;
//   permissions: string[];
//   isDefault?: boolean;
//   createdAt?: string;
// }

export interface RoleDialogData {
  role?: Role;
  isEdit: boolean;
}

@Component({
  selector: 'app-role-create-edit',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './role-create-edit.html',
  styleUrl: './role-create-edit.scss',
})
export class RoleCreateEdit {
  roleForm: FormGroup;
  availablePermissions: Permission[] = [];
  selectedPermissions: any[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<RoleCreateEdit>,
    @Inject(MAT_DIALOG_DATA) public data: RoleDialogData
  ) {
    this.roleForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-Z0-9\s]+$/),
        ],
      ],
    });
  }

  ngOnInit(): void {
    this.loadPermissions();
    this.initializeForm();
  }

  private async loadPermissions(): Promise<void> {
    try {
      this.roleService.loadRoles().subscribe((roles) => {
        this.availablePermissions = Array.from(
          new Set(roles.flatMap((r) => r.permissions))
        );
      });
    } catch (error) {
      this.snackBar.open('Failed to load permissions', 'Close', {
        duration: 3000,
      });
    }
  }

  private initializeForm(): void {
    if (this.data.isEdit && this.data.role) {
      this.roleForm.patchValue({
        name: this.data.role.name,
      });
      this.selectedPermissions = [...this.data.role.permissions];
    }
  }

  isPermissionSelected(permissionName: string): boolean {
    return this.selectedPermissions.includes(permissionName);
  }

  togglePermission(permissionName: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedPermissions.includes(permissionName)) {
        this.selectedPermissions.push(permissionName);
      }
    } else {
      this.selectedPermissions = this.selectedPermissions.filter(
        (p) => p !== permissionName
      );
    }
  }

  hasSelectedPermissions(): boolean {
    return this.selectedPermissions.length > 0;
  }

  isFormValid(): boolean {
    return this.roleForm.valid && this.hasSelectedPermissions();
  }

  formatPermissionName(permissionName: string): string {
    return permissionName
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  async onSave(): Promise<void> {
    if (!this.isFormValid()) {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isLoading = true;

    try {
      const roleData: Role = {
        name: this.roleForm.value.name.trim(),
        permissions: [...this.selectedPermissions],
        id: '',
        description: '',
        isSystemRole: false,
        createdAt: '',
      };

      let result: any;

      if (this.data.isEdit && this.data.role) {
        roleData.id = this.data.role.id;
        result = await this.roleService.updateRole(
          this.data.role.id!,
          roleData
        );
        this.snackBar.open('Role updated successfully', 'Close', {
          duration: 3000,
        });
      } else {
        const result$ = this.roleService.createRole(roleData);
        result = await result$.toPromise();
        this.snackBar.open('Role created successfully', 'Close', {
          duration: 3000,
        });
      }

      this.dialogRef.close(result);
    } catch (error: any) {
      const message =
        error?.error?.message || 'An error occurred while saving the role';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
