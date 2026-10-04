import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'p[appEmptyState], div[appEmptyState]',
  template: '<ng-content />',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class UiEmptyState {
  readonly appearance = input<'text' | 'panel' | 'large'>('text');
  readonly size = input<'small' | 'medium'>('medium');
  readonly tone = input<'muted' | 'contextual'>('muted');
  protected readonly classes = computed(() => `app-ui-empty-state app-ui-empty-state--${this.appearance()} app-ui-empty-state--${this.size()} app-ui-empty-state--${this.tone()}`);
}
