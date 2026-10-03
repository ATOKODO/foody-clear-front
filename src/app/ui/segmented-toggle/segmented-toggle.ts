
import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate-pipe';
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
  imports: [MatButtonToggleModule, TranslatePipe],
  templateUrl: './segmented-toggle.html',
  styleUrl: './segmented-toggle.scss',
})
export class SegmentedToggle<TValue extends string = string> {
  readonly value = input.required<TValue>();
  readonly options = input<readonly SegmentedToggleOption<TValue>[]>([]);
  readonly name = input('segmented-toggle');
  readonly ariaLabel = input('Selection');
  readonly testId = input<string>();
  readonly maxWidth = input('45.75rem');

  readonly valueChange = output<TValue>();

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
