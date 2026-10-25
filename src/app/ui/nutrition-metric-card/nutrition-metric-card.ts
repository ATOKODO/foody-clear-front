import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'div[appNutritionMetricCard]',
  template: '<ng-content />',
  styleUrl: './nutrition-metric-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-nutrition-metric-card',
    '[class.app-nutrition-metric-card--prominent]': 'prominent()',
  },
})
export class UiNutritionMetricCard {
  readonly prominent = input(false);
}
