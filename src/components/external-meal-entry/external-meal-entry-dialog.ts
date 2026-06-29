import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { DateTime } from 'luxon';
import {
  CreateExternalMealEntryDto,
  ExternalMealEntryPaymentStatus,
  InputDayDaySetSlotSummary,
} from '../../interfaces/input-day.interface';
import { InputDayService } from '../../services/input-day-service';
import { UiErrorPanel } from '../../app/ui/error-panel/error-panel';

export interface ExternalMealEntryDialogData {
  apiBaseUrl?: string | null;
  dateLocal: string;
  occurredAt?: string | null;
  timezone?: string | null;
  slots?: InputDayDaySetSlotSummary[] | null;
}

export interface ExternalMealEntryDialogResult {
  dateLocal: string;
}

interface ExternalMealEntrySlotOption {
  slotId: number | null;
  slotKey: string | null;
  title: string;
  rangeLabel: string;
}

@Component({
  selector: 'app-external-meal-entry-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    UiErrorPanel,
  ],
  templateUrl: './external-meal-entry-dialog.html',
  styleUrl: './external-meal-entry-dialog.scss',
})
export class ExternalMealEntryDialog {
  private readonly fb = inject(FormBuilder);
  private readonly inputDayService = inject(InputDayService);
  private readonly dialogRef = inject<
    MatDialogRef<ExternalMealEntryDialog, ExternalMealEntryDialogResult>
  >(MatDialogRef);
  readonly data = inject<ExternalMealEntryDialogData>(MAT_DIALOG_DATA);

  readonly paymentStatuses: { value: ExternalMealEntryPaymentStatus; label: string }[] = [
    { value: 'paid', label: 'Paye' },
    { value: 'free', label: 'Offert' },
    { value: 'refunded', label: 'Rembourse' },
  ];

  readonly slotOptions = this.resolveSlotOptions(this.data.slots ?? []);

  readonly form = this.fb.group({
    dateLocal: this.fb.control(this.resolveInitialDateLocal(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    occurredAt: this.fb.control(this.resolveInitialOccurredAt(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    name: this.fb.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    paymentStatus: this.fb.control<ExternalMealEntryPaymentStatus>('paid', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    priceAmount: this.fb.control<number | null>(null),
    slotKey: this.fb.control<string | null>(null),
    restaurantName: this.fb.control('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    note: this.fb.control('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    energyKcal: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    proteins: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    carbs: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    lipids: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
  });

  saving = false;
  error: unknown = null;

  readonly title = computed(() => 'Ajouter une entree exterieure');

  constructor() {
    if (this.data.apiBaseUrl?.trim()) {
      this.inputDayService.setBaseUrl(this.data.apiBaseUrl);
    }

    this.form.controls.paymentStatus.valueChanges.subscribe((status) => {
      if (status !== 'paid') {
        this.form.controls.priceAmount.setValue(null);
      }
    });
  }

  get isPaid(): boolean {
    return this.form.controls.paymentStatus.value === 'paid';
  }

  get canSubmit(): boolean {
    if (this.saving || this.form.invalid) {
      return false;
    }

    if (this.isPaid) {
      const price = this.form.controls.priceAmount.value;
      return typeof price === 'number' && Number.isFinite(price) && price > 0;
    }

    return true;
  }

  submit(): void {
    const payload = this.buildPayload();
    if (!payload) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;
    this.inputDayService.createExternalEntry(payload.dateLocal, payload).subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close({ dateLocal: payload.dateLocal });
      },
      error: (error) => {
        this.error = error;
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private buildPayload(): CreateExternalMealEntryDto | null {
    if (!this.canSubmit) {
      return null;
    }

    const value = this.form.getRawValue();
    const occurredAt = this.toOccurredAtIso(value.dateLocal, value.occurredAt);
    if (!occurredAt) {
      return null;
    }

    const slot = this.slotOptions.find((option) => option.slotKey === value.slotKey) ?? null;
    return {
      dateLocal: value.dateLocal,
      occurredAt,
      name: value.name.trim(),
      paymentStatus: value.paymentStatus,
      priceAmount: value.paymentStatus === 'paid' ? value.priceAmount : null,
      nutritionValue: {
        energyKcal: Number(value.energyKcal),
        proteins: Number(value.proteins),
        carbs: Number(value.carbs),
        lipids: Number(value.lipids),
      },
      slotId: slot?.slotId ?? null,
      slotKey: slot?.slotKey ?? null,
      restaurantName: this.emptyToNull(value.restaurantName),
      note: this.emptyToNull(value.note),
    };
  }

  private resolveInitialDateLocal(): string {
    const candidate = this.data.dateLocal?.trim();
    return candidate && DateTime.fromISO(candidate).isValid
      ? candidate
      : DateTime.local().toFormat('yyyy-LL-dd');
  }

  private resolveInitialOccurredAt(): string {
    const occurredAt = this.data.occurredAt?.trim();
    if (occurredAt) {
      const parsed = DateTime.fromISO(occurredAt, { setZone: true });
      if (parsed.isValid) {
        return parsed.setZone(this.resolveTimezone()).toFormat("yyyy-LL-dd'T'HH:mm");
      }
    }

    const dateLocal = this.resolveInitialDateLocal();
    const now = DateTime.local().setZone(this.resolveTimezone());
    const time = dateLocal === now.toFormat('yyyy-LL-dd') ? now : DateTime.fromISO(dateLocal, { zone: this.resolveTimezone() }).set({ hour: 12, minute: 0 });
    return time.toFormat("yyyy-LL-dd'T'HH:mm");
  }

  private toOccurredAtIso(dateLocal: string, value: string): string | null {
    const parsed = DateTime.fromISO(value, { zone: this.resolveTimezone() });
    if (!parsed.isValid) {
      return null;
    }

    const normalized = parsed.set({ second: 0, millisecond: 0 });
    const normalizedDate = normalized.toFormat('yyyy-LL-dd');
    if (normalizedDate !== dateLocal) {
      return normalized.set({
        year: Number(dateLocal.slice(0, 4)),
        month: Number(dateLocal.slice(5, 7)),
        day: Number(dateLocal.slice(8, 10)),
      }).toISO({ suppressMilliseconds: true });
    }

    return normalized.toISO({ suppressMilliseconds: true });
  }

  private resolveTimezone(): string {
    const candidate = this.data.timezone?.trim() || DateTime.local().zoneName || 'UTC';
    return DateTime.local().setZone(candidate).isValid ? candidate : 'UTC';
  }

  private resolveSlotOptions(slots: readonly InputDayDaySetSlotSummary[]): ExternalMealEntrySlotOption[] {
    return [...slots]
      .filter((slot) => slot.slotKey?.trim() || slot.slotId !== null)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, 'fr'))
      .map((slot) => ({
        slotId: slot.slotId,
        slotKey: slot.slotKey,
        title: slot.title,
        rangeLabel: this.formatSlotRange(slot),
      }));
  }

  private formatSlotRange(slot: InputDayDaySetSlotSummary): string {
    const start = slot.startTime?.slice(0, 5) ?? '';
    const end = slot.endTime?.slice(0, 5) ?? '';
    return start && end ? `${start}-${end}` : 'Sans horaire';
  }

  private emptyToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
}
