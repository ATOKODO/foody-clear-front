import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { UiButton } from '../button/button';

export type SelectableCardTone = 'success' | 'accent';

@Component({
  selector: 'div[appSelectableCard]',
  imports: [UiButton],
  template: `
    <button
      appButton
      variant="plain"
      type="button"
      class="app-selectable-card__control"
      [disabled]="disabled()"
      (click)="selectionRequested.emit()">
      <ng-content select="[selectable-card-content]" />
    </button>
    <ng-content select="[selectable-card-actions]" />
  `,
  styleUrl: './selectable-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-selectable-card',
    '[class.app-selectable-card--active]': 'active()',
    '[class.app-selectable-card--accent]': 'tone() === "accent"',
  },
})
export class UiSelectableCard {
  readonly active = input(false);
  readonly disabled = input(false);
  readonly tone = input<SelectableCardTone>('success');
  readonly selectionRequested = output<void>();
}
