import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'div[appCalendarPanel]',
  imports: [],
  templateUrl: './calendar-panel.html',
  styleUrl: './calendar-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-calendar-panel' },
})
export class UiCalendarPanel {}
