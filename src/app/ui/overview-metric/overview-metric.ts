import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'div[appOverviewMetric]',
  template: `
    <span class="app-overview-metric__value calendar-week-overview__value">{{ value() }}</span>
    <span class="app-overview-metric__label calendar-week-overview__label">{{ label() }}</span>
  `,
  styleUrl: './overview-metric.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-overview-metric' },
})
export class UiOverviewMetric {
  readonly value = input.required<number | string>();
  readonly label = input.required<string>();
}
