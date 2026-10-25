import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { UiButton } from '../button/button';
import { UiIcon } from '../icon/icon';
import type { IconName } from '../icon/glyphs';

export type ActionCardTone = 'accent' | 'info' | 'neutral';

@Component({
  selector: 'app-action-card',
  imports: [UiButton, UiIcon],
  templateUrl: './action-card.html',
  styleUrl: './action-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiActionCard {
  readonly icon = input.required<IconName>();
  readonly label = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly tone = input<ActionCardTone>('neutral');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly activated = output<MouseEvent>();
}
