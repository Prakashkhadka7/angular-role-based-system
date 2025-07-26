
// user-create-edit-dialog.component.ts
import { Component, Inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CreateUserRequest, UpdateUserRequest, User } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { v4 as uuidv4 } from 'uuid';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


interface DialogData {
  user?: User;
  isEditMode: boolean;
}

@Component({
  selector: 'app-user-create-edit',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    CommonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './user-create-edit.html',
  styleUrl: './user-create-edit.scss',
})
export class UserCreateEdit implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  userForm!: FormGroup;
  roles: Role[] = [];
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  // Dialog properties
  dialogTitle: string;
  submitButtonText: string;
  isEditMode: boolean;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UserCreateEdit>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private changeDetectionRef : ChangeDetectorRef,
  ) {
    this.isEditMode = data.isEditMode;
    this.dialogTitle = this.isEditMode ? 'Edit User' : 'Create New User';
    this.submitButtonText = this.isEditMode ? 'Update User' : 'Create User';

    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadRoles();

    if (this.isEditMode && this.data.user) {
      this.populateForm(this.data.user);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.userForm = this.fb.group({
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
          Validators.pattern(/^[a-zA-Z\s]+$/),
        ],
      ],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9_]+$/),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(255)],
      ],
      password: [
        '',
        this.isEditMode
          ? []
          : [
              Validators.required,
              Validators.minLength(8),
              Validators.pattern(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
              ),
            ],
      ],
      confirmPassword: ['', this.isEditMode ? [] : [Validators.required]],
      roleId: ['', [Validators.required]],
      isActive: [true],
    });

    // Add password match validator
    this.userForm.setValidators((control: AbstractControl) => {
      return this.passwordMatchValidator(control as FormGroup);
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    // Skip validation if in edit mode and password is empty
    if (this.isEditMode && (!password?.value || !confirmPassword?.value)) {
      return null;
    }

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({
        ...confirmPassword.errors,
        passwordMismatch: true,
      });
      return { passwordMismatch: true };
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  private loadRoles(): void {
    this.roleService
      .loadRoles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.roles = roles.filter((role) => role.name !== 'Super Admin'); // Hide Super Admin role
          this.changeDetectionRef.detectChanges();
        },
        error: (error) => {
          console.error('Error loading roles:', error);
          this.snackBar.open('Error loading roles', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  private populateForm(user: User): void {
    this.userForm.patchValue({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive,
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isLoading = true;

      if (this.isEditMode) {
        this.updateUser();
      } else {
        this.createUser();
      }
    } else {
      this.markFormGroupTouched();
      this.showValidationErrors();
    }
  }

  private createUser(): void {
    const formValue = this.userForm.value;
    const userData: Omit<CreateUserRequest, 'id' | 'createdAt'> = {
      fullName: formValue.fullName.trim(),
      username: formValue.username.trim().toLowerCase(),
      email: formValue.email.trim().toLowerCase(),
      password: formValue.password,
      roleId: formValue.roleId,
      isActive: formValue.isActive,
    };

    this.userService
      .createUser(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.snackBar.open('User created successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.dialogRef.close({ success: true, user, action: 'create' });
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.handleError(error);
          this.isLoading = false;
        },
      });
  }

  private updateUser(): void {
    if (!this.data.user) return;

    const formValue = this.userForm.value;
    const userData: UpdateUserRequest = {
      fullName: formValue.fullName.trim(),
      username: formValue.username.trim().toLowerCase(),
      email: formValue.email.trim().toLowerCase(),
      roleId: formValue.roleId,
      isActive: formValue.isActive,
    };

    // Include password only if provided
    if (formValue.password && formValue.password.trim()) {
      userData.password = formValue.password;
    }

    this.userService
      .updateUser(this.data.user.id, userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.snackBar.open('User updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.dialogRef.close({ success: true, user, action: 'update' });
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.handleError(error);
          this.isLoading = false;
        },
      });
  }

  private handleError(error: any): void {
    let errorMessage = 'An error occurred';

    if (error.status === 409) {
      errorMessage = 'Username or email already exists';
    } else if (error.status === 400) {
      errorMessage = 'Invalid data provided';
    } else if (error.status === 404) {
      errorMessage = 'User not found';
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  private showValidationErrors(): void {
    const errors: string[] = [];

    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      if (control?.errors && control.touched) {
        const fieldName = this.getFieldDisplayName(key);
        const error = this.getFieldError(key);
        if (error) {
          errors.push(`${fieldName}: ${error}`);
        }
      }
    });

    if (errors.length > 0) {
      this.snackBar.open('Please fix the validation errors', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  onCancel(): void {
    if (this.userForm.dirty && !this.isLoading) {
      if (
        confirm('You have unsaved changes. Are you sure you want to cancel?')
      ) {
        this.dialogRef.close({ success: false });
      }
    } else {
      this.dialogRef.close({ success: false });
    }
  }

  // Form validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);

    if (field?.errors && field.touched) {
      const errors = field.errors;

      if (errors['required']) {
        return 'This field is required';
      }

      if (errors['minlength']) {
        return `Minimum ${errors['minlength'].requiredLength} characters required`;
      }

      if (errors['maxlength']) {
        return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
      }

      if (errors['email']) {
        return 'Please enter a valid email address';
      }

      if (errors['pattern']) {
        switch (fieldName) {
          case 'fullName':
            return 'Only letters and spaces are allowed';
          case 'username':
            return 'Only letters, numbers, and underscores are allowed';
          case 'password':
            return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
          default:
            return 'Invalid format';
        }
      }

      if (errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }

    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      fullName: 'Full Name',
      username: 'Username',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      roleId: 'Role',
    };

    return displayNames[fieldName] || fieldName;
  }

  // Form control getters
  get fullName() {
    return this.userForm.get('fullName');
  }
  get username() {
    return this.userForm.get('username');
  }
  get email() {
    return this.userForm.get('email');
  }
  get password() {
    return this.userForm.get('password');
  }
  get confirmPassword() {
    return this.userForm.get('confirmPassword');
  }
  get roleId() {
    return this.userForm.get('roleId');
  }
  get isActive() {
    return this.userForm.get('isActive');
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  // Check if passwords should be shown (not in edit mode or password has value)
  shouldShowPasswordFields(): boolean {
    return !this.isEditMode || this.password?.value;
  }

  // Generate random password
  generatePassword(): void {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&';
    let password = '';

    // Ensure at least one character from each required category
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // special char

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    password = password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');

    this.userForm.patchValue({
      password: password,
      confirmPassword: password,
    });

    this.hidePassword = false;
    this.hideConfirmPassword = false;

    this.snackBar.open('Password generated successfully', 'Close', {
      duration: 2000,
    });
  }

  getRolePermissions(roleId: string) {
    const role = this.roles?.find((r) => r.id == roleId);
    return role?.permissions || [];
  }

  formatData(data: any) {
    return data?.name.replace('_', ' ');
  }
}