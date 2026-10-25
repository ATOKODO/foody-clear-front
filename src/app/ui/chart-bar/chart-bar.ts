import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ChartBarVariant = 'expense' | 'goal' | 'actual';

@Component({
  selector: 'app-chart-bar',
  host: {
    role: 'presentation',
    '[class]': '"app-chart-bar app-chart-bar--" + variant()',
    '[style.height]': 'height() + "%"',
  },
  template: '',
  styleUrl: './chart-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiChartBar {
  readonly variant = input.required<ChartBarVariant>();
  readonly height = input.required<number>();
}
