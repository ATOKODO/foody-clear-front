import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  ExternalMealEntryDialog,
  ExternalMealEntryDialogData,
  ExternalMealEntryDialogResult,
} from '../components/external-meal-entry/external-meal-entry-dialog';

@Injectable({ providedIn: 'root' })
export class ExternalMealEntryDialogService {
  private readonly dialog = inject(MatDialog);

  openCreate(data: ExternalMealEntryDialogData): Observable<ExternalMealEntryDialogResult | undefined> {
    const dialogRef = this.dialog.open<
      ExternalMealEntryDialog,
      ExternalMealEntryDialogData,
      ExternalMealEntryDialogResult
    >(ExternalMealEntryDialog, {
      width: 'min(46rem, calc(100vw - 1.5rem))',
      maxWidth: 'calc(100vw - 1.5rem)',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data,
    });

    return dialogRef.afterClosed();
  }
}
