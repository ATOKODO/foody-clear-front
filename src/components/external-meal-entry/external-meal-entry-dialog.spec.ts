import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { InputDayService } from '../../services/input-day-service';
import { ExternalMealEntryDialog, ExternalMealEntryDialogData } from './external-meal-entry-dialog';

describe('ExternalMealEntryDialog', () => {
  let fixture: ComponentFixture<ExternalMealEntryDialog>;
  let component: ExternalMealEntryDialog;

  const dialogRefMock = {
    close: jasmine.createSpy('close'),
  };

  const inputDayServiceMock = {
    setBaseUrl: jasmine.createSpy('setBaseUrl'),
    createExternalEntry: jasmine.createSpy('createExternalEntry').and.returnValue(of({})),
  };

  const dialogData: ExternalMealEntryDialogData = {
    apiBaseUrl: 'http://localhost:3000',
    dateLocal: '2026-03-25',
    occurredAt: '2026-03-25T12:30:00+01:00',
    timezone: 'Europe/Paris',
    slots: [
      {
        slotId: 2,
        slotKey: 'lunch',
        title: 'Dejeuner',
        sortOrder: 2,
        startTime: '12:00',
        endTime: '13:30',
        nutritionValue: null,
      },
    ],
  };

  beforeEach(async () => {
    dialogData.apiBaseUrl = 'http://localhost:3000';
    dialogData.dateLocal = '2026-03-25';
    dialogData.occurredAt = '2026-03-25T12:30:00+01:00';
    dialogData.timezone = 'Europe/Paris';
    dialogRefMock.close.calls.reset();
    inputDayServiceMock.setBaseUrl.calls.reset();
    inputDayServiceMock.createExternalEntry.calls.reset();
    inputDayServiceMock.createExternalEntry.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ExternalMealEntryDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: InputDayService, useValue: inputDayServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExternalMealEntryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should require a price for paid entries', () => {
    component.form.patchValue({
      name: 'Burger restaurant',
      paymentStatus: 'paid',
      priceAmount: null,
      energyKcal: 850,
      proteins: 42,
      carbs: 75,
      lipids: 32,
      slotKey: 'lunch',
    });

    expect(component.canSubmit).toBeFalse();

    component.form.patchValue({ priceAmount: 18.5 });

    expect(component.canSubmit).toBeTrue();
  });

  it('should submit free entries with a null price', () => {
    component.form.patchValue({
      name: 'Repas offert',
      paymentStatus: 'free',
      priceAmount: 12,
      energyKcal: 620,
      proteins: 28,
      carbs: 80,
      lipids: 18,
      slotKey: 'lunch',
    });

    component.submit();

    expect(inputDayServiceMock.createExternalEntry).toHaveBeenCalledWith(
      '2026-03-25',
      jasmine.objectContaining({
        name: 'Repas offert',
        paymentStatus: 'free',
        priceAmount: null,
        slotId: 2,
        slotKey: 'lunch',
      }),
    );
    expect(dialogRefMock.close).toHaveBeenCalledWith({ dateLocal: '2026-03-25' });
  });

  it('should cover validation, errors, cancellation, and slot/date helpers', () => {
    expect(component.title()).toBe('Add external entry');
    expect(component.isPaid).toBeTrue();
    component.saving = true;
    expect(component.canSubmit).toBeFalse();
    component.saving = false;

    component.submit();
    expect(inputDayServiceMock.createExternalEntry).toHaveBeenCalledTimes(0);

    component.form.patchValue({
      name: 'Invalid time',
      paymentStatus: 'free',
      energyKcal: 100,
      proteins: 10,
      carbs: 20,
      lipids: 5,
      occurredAt: 'invalid',
    });
    expect(component.canSubmit).toBeTrue();
    component.submit();
    expect(inputDayServiceMock.createExternalEntry).toHaveBeenCalledTimes(0);

    component.form.patchValue({
      occurredAt: '2026-03-25T12:30',
      restaurantName: ' Restaurant ',
      note: ' Note ',
      slotKey: 'missing',
    });
    inputDayServiceMock.createExternalEntry.and.returnValue(
      throwError(() => new Error('save failed')),
    );
    component.submit();
    expect(component.error).toEqual(jasmine.any(Error));
    expect(component.saving).toBeFalse();

    component.cancel();
    expect(dialogRefMock.close).toHaveBeenCalledWith();

    const callPrivate = privateMethod(component);
    const options = callPrivate('resolveSlotOptions', [
      {
        slotId: null,
        slotKey: '',
        title: 'Ignored',
        sortOrder: 3,
        startTime: null,
        endTime: null,
        nutritionValue: null,
      },
      {
        slotId: 4,
        slotKey: 'dinner',
        title: 'Dinner',
        sortOrder: 2,
        startTime: null,
        endTime: '20:00',
        nutritionValue: null,
      },
      {
        slotId: 5,
        slotKey: 'snack',
        title: 'Snack',
        sortOrder: 1,
        startTime: '16:00',
        endTime: '16:30',
        nutritionValue: null,
      },
    ]);
    expect(options).toEqual([
      jasmine.objectContaining({ slotId: 5, rangeLabel: '16:00-16:30' }),
      jasmine.objectContaining({ slotId: 4, rangeLabel: 'Sans horaire' }),
    ]);
    expect(callPrivate('emptyToNull', '  ')).toBeNull();
    expect(callPrivate('emptyToNull', ' text ')).toBe('text');
    expect(callPrivate('toOccurredAtIso', '2026-03-25', '2026-03-26T08:15')).toContain(
      '2026-03-25',
    );
    expect(callPrivate('toOccurredAtIso', '2026-03-25', 'invalid')).toBeNull();

    const mutableData = component.data as ExternalMealEntryDialogData & {
      dateLocal: string;
      occurredAt: string;
      timezone: string;
    };
    mutableData.dateLocal = 'invalid';
    mutableData.occurredAt = 'invalid';
    mutableData.timezone = 'invalid/timezone';
    expect(callPrivate('resolveInitialDateLocal')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    mutableData.dateLocal = '2026-01-01';
    expect(callPrivate('resolveInitialOccurredAt')).toContain('T12:00');
    expect(callPrivate('resolveTimezone')).toBe('UTC');
  });
});

function privateMethod(
  component: ExternalMealEntryDialog,
): (name: string, ...args: unknown[]) => unknown {
  const methods = component as unknown as Record<string, (...args: unknown[]) => unknown>;
  return (name, ...args) => methods[name](...args);
}
