import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconDefinition, IconName, UI_ICONS } from './glyphs';

export type IconSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-icon',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      [attr.data-icon]="name()"
      [attr.fill]="glyph().filled ? 'currentColor' : 'none'"
      [attr.stroke]="glyph().filled ? null : 'currentColor'"
      [attr.stroke-width]="glyph().strokeWidth ?? null"
      stroke-linecap="round" stroke-linejoin="round">
      @if (glyph().circle; as circle) { <circle [attr.cx]="circle.cx" [attr.cy]="circle.cy" [attr.r]="circle.r" /> }
      @for (path of glyph().paths; track $index) { <path [attr.d]="path" /> }
    </svg>
  `,
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-ui-icon',
    '[class.app-ui-icon--small]': 'size() === "small"',
    '[class.app-ui-icon--large]': 'size() === "large"',
    '[attr.aria-hidden]': 'accessibleLabel() ? null : "true"',
    '[attr.role]': 'accessibleLabel() ? "img" : null',
    '[attr.aria-label]': 'accessibleLabel() || null',
  },
})
export class UiIcon {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>('medium');
  readonly label = input('');
  protected readonly accessibleLabel = computed(() => this.label().trim());
  protected readonly glyph = computed<IconDefinition>(() => UI_ICONS[this.name()]);
}
