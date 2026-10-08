import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'span[appSummaryPill]',
  template: '<ng-content />',
  styleUrl: './summary-pill.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-summary-pill' },
})
export class UiSummaryPill {}
