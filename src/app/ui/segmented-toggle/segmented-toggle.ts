import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';

export interface SegmentedToggleOption<TValue extends string = string> {
  value: TValue;
  label: string;
  testId?: string;
}

@Component({
  selector: 'app-segmented-toggle',
  imports: [CommonModule, MatButtonToggleModule],
  templateUrl: './segmented-toggle.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './segmented-toggle.scss',
})
export class SegmentedToggle<TValue extends string = string> {
  @Input() value!: TValue;
  @Input() options: readonly SegmentedToggleOption<TValue>[] = [];
  @Input() name = 'segmented-toggle';
  @Input() ariaLabel = 'Selection';
  @Input() testId?: string;
  @Input() maxWidth = '45.75rem';

  @Output() readonly valueChange = new EventEmitter<TValue>();

  trackByValue(_: number, option: SegmentedToggleOption<TValue>): TValue {
    return option.value;
  }

  onSelectionChange(event: MatButtonToggleChange): void {
    if (typeof event.value !== 'string') {
      return;
    }

    this.valueChange.emit(event.value as TValue);
  }
}
