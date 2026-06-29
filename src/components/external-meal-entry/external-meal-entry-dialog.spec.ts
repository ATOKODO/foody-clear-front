import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
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
    dialogRefMock.close.calls.reset();
    inputDayServiceMock.setBaseUrl.calls.reset();
    inputDayServiceMock.createExternalEntry.calls.reset();

    await TestBed.configureTestingModule({
      imports: [ExternalMealEntryDialog, NoopAnimationsModule],
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
});
