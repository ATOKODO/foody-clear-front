import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: '[appRaisedPanel]',
  template: '<ng-content />',
  styleUrl: './raised-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-raised-panel' },
})
export class UiRaisedPanel {}
