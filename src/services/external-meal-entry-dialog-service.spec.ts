import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ExternalMealEntryDialogService } from './external-meal-entry-dialog-service';

describe('ExternalMealEntryDialogService', () => {
  it('opens the external-entry dialog and returns its closed result', () => {
    const dialog = {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: () => of({ dateLocal: '2026-07-11' }),
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        ExternalMealEntryDialogService,
        { provide: MatDialog, useValue: dialog },
      ],
    });

    const service = TestBed.inject(ExternalMealEntryDialogService);
    const result: unknown[] = [];
    service.openCreate({ dateLocal: '2026-07-11' }).subscribe((value) => result.push(value));

    expect(dialog.open).toHaveBeenCalled();
    expect(result).toEqual([{ dateLocal: '2026-07-11' }]);
  });
});
