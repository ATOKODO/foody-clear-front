import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AlertTone = 'warning' | 'error' | 'info' | 'success';

@Component({
  selector: '[appAlert]',
  template: '<ng-content />',
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class UiAlert {
  readonly tone = input<AlertTone>('warning');
  protected readonly classes = computed(() => `app-alert app-alert--${this.tone()}`);
}
