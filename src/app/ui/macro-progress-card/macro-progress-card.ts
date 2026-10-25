import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type MacroProgressStatus = 'neutral' | 'under' | 'exact' | 'over';

@Component({
  selector: 'app-macro-progress-card',
  templateUrl: './macro-progress-card.html',
  styleUrl: './macro-progress-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiMacroProgressCard {
  readonly label = input.required<string>();
  readonly actual = input.required<string>();
  readonly target = input.required<string>();
  readonly delta = input.required<string>();
  readonly progress = input.required<number>();
  readonly status = input.required<MacroProgressStatus>();
}
