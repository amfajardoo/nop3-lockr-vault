import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";

interface CredentialDeleteDialogData {
  name: string;
}

@Component({
  selector: "credential-delete-dialog",
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Delete "{{ data.name }}"?</h2>
    <p mat-dialog-content>This action cannot be undone.</p>
    <mat-dialog-actions align="end">
      <button mat-button type="button" data-cancel-delete (click)="close(false)">Cancel</button>
      <button mat-button color="warn" type="button" data-confirm-delete (click)="close(true)">
        Delete
      </button>
    </mat-dialog-actions>
  `,
})
export class CredentialDeleteDialog {
  protected readonly data = inject<CredentialDeleteDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CredentialDeleteDialog, boolean>);

  protected close(confirmed: boolean): void {
    this.dialogRef.close(confirmed);
  }
}
