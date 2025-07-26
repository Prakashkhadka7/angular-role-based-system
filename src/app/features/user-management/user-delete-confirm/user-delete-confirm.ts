import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-user-delete-confirm',
  imports: [
    MatIconModule,
    MatDialogModule,
    CommonModule
    
  ],
  templateUrl: './user-delete-confirm.html',
  styleUrl: './user-delete-confirm.scss'
})
export class UserDeleteConfirm {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

}
